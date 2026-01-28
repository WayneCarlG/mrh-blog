import { useState, useRef } from "react";
import api from '../../api';

export default function CreatePostModal({ isOpen, onClose }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    status: "draft",
    content: "",
    coverImage: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function format(command, value = null) {
    editorRef.current.focus();
    document.execCommand(command, false, value);
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      editorRef.current.focus();
      document.execCommand("insertImage", false, reader.result);
      setFormData({ ...formData, coverImage: reader.result });
    };
    reader.readAsDataURL(file);
  }

 async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);
  setError("");

  const content = editorRef.current.innerHTML.trim();

  // Validate required fields
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

  if (!content || content === "<br>") {
    setError("Content is required");
    setLoading(false);
    return;
  }

  const payload = {
    title: formData.title,
    category: formData.category,
    status: formData.status,
    content,
    coverImage: formData.coverImage,
  };

  try {
    const response = await api.post("/create-post", payload);
    console.log("Post created:", response.data);

    // Reset form
    setFormData({
      title: "",
      category: "",
      status: "draft",
      content: "",
      coverImage: null,
    });
    editorRef.current.innerHTML = "";

    onClose();
  } catch (err) {
    console.error("Error creating post:", err);
    const errorMessage = err.response?.data?.error || err.response?.data?.details || "Failed to create post";
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
  console.log("JWT", localStorage.getItem("token"));
}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-xl font-bold text-[#0A1A2F]">Create New Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block font-medium mb-1">Post Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
              required
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
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
              <label className="block font-medium mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Publish</option>
              </select>
            </div>
          </div>
          {error && (
            <p className="text-red-500 text-sm font-medium">{error}</p>
            )}

          {/* Editor */}
          <div className="border rounded-lg">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
              <button type="button" onClick={() => format("bold")} className="editor-btn font-bold">B</button>
              <button type="button" onClick={() => format("italic")} className="editor-btn italic">I</button>
              <button type="button" onClick={() => format("underline")} className="editor-btn underline">U</button>

              <button type="button" onClick={() => format("insertUnorderedList")} className="editor-btn">•≡</button>
              <button type="button" onClick={() => format("insertOrderedList")} className="editor-btn">1≡</button>

              <button type="button" onClick={() => format("justifyLeft")} className="editor-btn">⬅</button>
              <button type="button" onClick={() => format("justifyCenter")} className="editor-btn">⬍</button>
              <button type="button" onClick={() => format("justifyRight")} className="editor-btn">➡</button>

              <button type="button" onClick={() => format("formatBlock", "h2")} className="editor-btn">H2</button>
              <button type="button" onClick={() => format("formatBlock", "p")} className="editor-btn">P</button>

              {/* Image Upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="editor-btn"
              >
                🖼
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Content Area */}
            <div
              ref={editorRef}
              contentEditable
              className="min-h-[220px] p-4 outline-none"
              placeholder="Write your blog content here..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg border hover:bg-gray-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 rounded-lg text-white ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-cyan-500 hover:bg-cyan-600"
              }`}
            >
              {loading ? "Saving..." : "Save Post"}
            </button>
          </div>
        </form>
      </div>

      {/* Toolbar styles */}
      <style>{`
        .editor-btn {
          padding: 0.35rem 0.6rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: white;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .editor-btn:hover {
          background: #e0f7fa;
        }
      `}</style>
    </div>
  );
}