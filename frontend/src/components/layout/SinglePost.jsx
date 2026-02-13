import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

export default function SinglePost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await api.get(`/posts/${id}`);
        setPost(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load post");
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!post) return <p className="text-center">Post not found</p>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">

      {/* ================= SIDEBAR ================= */}
      <div className="
        w-full md:w-64 
        bg-blue-900 text-white 
        p-6 md:p-8 
        flex md:block 
        justify-between md:justify-start
        items-center md:items-start
      ">
        {/* Author + Date */}
        <div className="md:sticky md:top-10">
          <p className="font-semibold text-lg">
            By {post.author?.name}
          </p>

          <p className="text-sm opacity-90">
            {new Date(post.createdAt).toLocaleDateString()}
          </p>

          {/* <p className="text-xs uppercase mt-2 opacity-75 hidden md:block">
            {post.category}
          </p> */}
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1">

        {/* ===== TITLE SECTION ===== */}
        <div className="bg-white border-b border-gray-300 py-8 px-6 md:px-12">
          <h1 className="text-2xl md:text-4xl font-bold text-black uppercase leading-tight">
            {post.title}
          </h1>
        </div>

        {/* ===== CONTENT AREA ===== */}
        <div className="px-6 md:px-12 py-8 space-y-8 max-w-5xl">

          {/* Cover Image */}
          {post.coverImage && (
            <div className="rounded-lg overflow-hidden shadow">
              <img
                src={`http://localhost:5000/${post.coverImage}`}
                alt={post.title}
                className="w-full h-64 md:h-96 object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="bg-white p-6 md:p-8 rounded-lg shadow">
            <div className="whitespace-pre-line text-gray-800 text-base md:text-lg leading-relaxed">
              {post.content}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}