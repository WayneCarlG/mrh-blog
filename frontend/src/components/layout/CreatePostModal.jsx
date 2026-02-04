import { useState, useRef, useEffect } from "react";
import api from "../../api";

export default function CreatePostModal({ isOpen, onClose }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    status: "draft",
    coverImage: null, // base64 for preview + send
  });

  const [coverPreview, setCoverPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      // Full reset when modal closes
      setFormData({ title: "", category: "", status: "draft", coverImage: null });
      setCoverPreview(null);
      setError("");
      if (editorRef.current) editorRef.current.innerHTML = "";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const format = (command, value = null) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
    }
  };

  const handleContentImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand("insertImage", false, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Cover image must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCoverPreview(reader.result);
      setFormData((prev) => ({ ...prev, coverImage: reader.result }));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const getEditorContent = () => {
    return editorRef.current?.innerHTML?.trim() || "";
  };

  const isEditorEmpty = (html) => {
    if (!html) return true;
    const text = html.replace(/<[^>]+>/g, "").trim();
    return text.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const content = getEditorContent();

    // Validation
    if (!formData.title.trim()) {
      setError("Title is required");
      setLoading(false);
      return;
    }

    if (!formData.category) {
      setError("Please select a category");
      setLoading(false);
      return;
    }

    if (isEditorEmpty(content)) {
      setError("Post content cannot be empty");
      setLoading(false);
      return;
    }

    const payload = {
      title: formData.title.trim(),
      category: formData.category,
      status: formData.status,
      content,
      coverImage: formData.coverImage, // base64 or null
    };

    try {
      const response = await api.post('/create-post', payload);

      console.log("Post created:", response.data);

      // Reset
      setFormData({ title: "", category: "", status: "draft", coverImage: null });
      setCoverPreview(null);
      if (editorRef.current) editorRef.current.innerHTML = "";

      onClose();
      // Optional: toast / alert("Post saved!")
    } catch (err) {
      console.error("Create post error:", err);

      let msg = "An unexpected error occurred";

      if (err.response) {
        const { status, data } = err.response;
        if (status === 400) msg = data?.error || "Invalid data";
        else if (status === 401) msg = "Please log in again";
        else if (status === 413) msg = "Image too large";
        else if (status >= 500) msg = data?.error || "Server error";
        else msg = data?.error || `Error ${status}`;
      } else if (err.request) {
        msg = "Cannot reach the server. Check your connection.";
      } else {
        msg = err.message || "Request failed";
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Create New Post</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 gap-5 overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              maxLength={120}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
              placeholder="Enter an engaging title..."
              required
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {formData.title.length} / 120
            </div>
          </div>

          {/* Category + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none bg-white"
                required
              >
                <option value="">Select category</option>
                <option value="Revival">Revival</option>
                <option value="Spirituality and Science">Spirituality and Science</option>
                <option value="Christianity vs Tradition">Christianity vs Tradition</option>
                <option value="Tampered Faith">Tampered Faith</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none bg-white"
              >
                <option value="draft">Save as Draft</option>
                <option value="published">Publish Now</option>
              </select>
            </div>
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image (optional)</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition"
              >
                Choose cover image
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverImageChange}
                className="hidden"
              />
              {coverPreview && (
                <div className="relative w-32 h-20 rounded overflow-hidden border">
                  <img src={coverPreview} alt="Cover preview" className="object-cover w-full h-full" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Max 5MB • Recommended 1200×630</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Rich Text Editor */}
          <div className="border border-gray-300 rounded-lg overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-gray-50 border-b">
              <button type="button" onClick={() => format("bold")} className="editor-btn font-bold px-3 py-1.5">B</button>
              <button type="button" onClick={() => format("italic")} className="editor-btn italic px-3 py-1.5">I</button>
              <button type="button" onClick={() => format("underline")} className="editor-btn underline px-3 py-1.5">U</button>

              <span className="w-px h-6 bg-gray-300 mx-1 self-center" />

              <button type="button" onClick={() => format("insertUnorderedList")} className="editor-btn px-3 py-1.5">• List</button>
              <button type="button" onClick={() => format("insertOrderedList")} className="editor-btn px-3 py-1.5">1. List</button>

              <span className="w-px h-6 bg-gray-300 mx-1 self-center" />

              <button type="button" onClick={() => format("justifyLeft")} className="editor-btn px-3 py-1.5">Left</button>
              <button type="button" onClick={() => format("justifyCenter")} className="editor-btn px-3 py-1.5">Center</button>
              <button type="button" onClick={() => format("justifyRight")} className="editor-btn px-3 py-1.5">Right</button>

              <span className="w-px h-6 bg-gray-300 mx-1 self-center" />

              <button type="button" onClick={() => format("formatBlock", "h2")} className="editor-btn px-3 py-1.5">H2</button>
              <button type="button" onClick={() => format("formatBlock", "p")} className="editor-btn px-3 py-1.5">P</button>

              <span className="w-px h-6 bg-gray-300 mx-1 self-center" />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="editor-btn px-3 py-1.5 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
              >
                Insert Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleContentImageUpload}
                className="hidden"
              />
            </div>

            {/* Editor Area */}
            <div
              ref={editorRef}
              contentEditable
              className="min-h-[280px] p-5 focus:outline-none prose prose-sm sm:prose lg:prose-lg max-w-none"
              placeholder="Start writing your post here..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  // Optional: prevent form submit on Enter outside of editor
                  // e.preventDefault(); // ← uncomment if needed
                }
              }}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-lg text-white font-medium transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-cyan-600 hover:bg-cyan-700"
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  </svg>
                  Saving...
                </span>
              ) : formData.status === "published" ? "Publish" : "Save Draft"}
            </button>
          </div>
        </form>

        <style jsx>{`
          .editor-btn {
            @apply border border-gray-300 rounded-md bg-white hover:bg-gray-100 text-sm font-medium transition;
          }
          .prose :where(placeholder):not(:where([class~="not-prose"] *)) {
            color: #9ca3af;
          }
        `}</style>
      </div>
    </div>
  );
}