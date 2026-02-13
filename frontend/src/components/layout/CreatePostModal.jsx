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
    coverImage: null,
  });

  const [coverPreview, setCoverPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
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
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const applyInlineStyle = (style) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    Object.assign(span.style, style);
    range.surroundContents(span);
  };

  const changeFontFamily = (e) => {
    if (e.target.value) applyInlineStyle({ fontFamily: e.target.value });
  };

  const changeFontSize = (e) => {
    if (e.target.value) applyInlineStyle({ fontSize: e.target.value });
  };

  const changeTextColor = (e) => format("foreColor", e.target.value);
  const changeHighlightColor = (e) => format("hiliteColor", e.target.value);

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) format("createLink", url);
  };

  const handleContentImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      format("insertImage", reader.result);
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

    try {
      await api.post("/create-post", {
        ...formData,
        content,
      });

      setFormData({ title: "", category: "", status: "draft", coverImage: null });
      setCoverPreview(null);
      editorRef.current.innerHTML = "";
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create post");
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
            className="text-gray-500 hover:text-red-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 gap-5 overflow-y-auto">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              maxLength={120}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 outline-none"
              placeholder="Enter an engaging title..."
              required
            />
          </div>

          {/* Category + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
              required
            >
              <option value="">Select category</option>
              <option value="Revival">Revival</option>
              <option value="Spirituality and Science">Spirituality and Science</option>
              <option value="Christianity vs Tradition">Christianity vs Tradition</option>
              <option value="Tampered Faith">Tampered Faith</option>
            </select>

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
            >
              <option value="draft">Save as Draft</option>
              <option value="published">Publish Now</option>
            </select>
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Image (optional)
            </label>

            <div className="flex items-center gap-4 flex-wrap">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
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
                <div className="relative w-40 h-24 rounded overflow-hidden border">
                  <img src={coverPreview} alt=" " className="object-cover w-full h-full" />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverPreview(null);
                      setFormData(prev => ({ ...prev, coverImage: null }));
                    }}
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Editor */}
          <div className="border border-gray-300 rounded-lg overflow-hidden flex flex-col">

            {/* Toolbar */}
            <div className="sticky top-0 z-10 flex flex-wrap gap-2 p-2.5 bg-gray-50 border-b">

              <button type="button" onClick={() => format("undo")} className="editor-btn">Undo</button>
              <button type="button" onClick={() => format("redo")} className="editor-btn">Redo</button>

              <button type="button" onClick={() => format("bold")} className="editor-btn font-bold">B</button>
              <button type="button" onClick={() => format("italic")} className="editor-btn italic">I</button>
              <button type="button" onClick={() => format("underline")} className="editor-btn underline">U</button>

              <button type="button" onClick={insertLink} className="editor-btn">Link</button>

              <select onChange={changeFontFamily} className="editor-btn">
                <option value="">Font</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier</option>
                <option value="Verdana">Verdana</option>
              </select>

              <select onChange={changeFontSize} className="editor-btn">
                <option value="">Size</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="24px">24px</option>
                <option value="32px">32px</option>
              </select>

              <input type="color" onChange={changeTextColor} title="Text Color" />
              <input type="color" onChange={changeHighlightColor} title="Highlight Color" />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="editor-btn bg-cyan-50 text-cyan-700"
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
              className="min-h-[280px] p-5 focus:outline-none"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-4 pt-4 border-t mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-lg text-white ${
                loading ? "bg-gray-400" : "bg-cyan-600 hover:bg-cyan-700"
              }`}
            >
              {loading
                ? "Saving..."
                : formData.status === "published"
                ? "Publish"
                : "Save Draft"}
            </button>
          </div>
        </form>

        <style jsx>{`
          .editor-btn {
            @apply border border-gray-300 rounded-md bg-white hover:bg-gray-100 text-sm px-3 py-1 transition;
          }
        `}</style>
      </div>
    </div>
  );
}
