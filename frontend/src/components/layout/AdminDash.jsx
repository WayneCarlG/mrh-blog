import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import CreatePostModal from "./CreatePostModal";
import api from '../../api';
import { Edit2, Trash2 } from "lucide-react";

export default function AdminDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get("/posts");
      setPosts(response.data);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 text-[#0A1A2F] flex">
              {/* Sidebar */}
              <aside className="w-64 bg-[#0A1A2F] text-white flex flex-col">
                <div className="p-6 text-2xl font-bold text-yellow-400">Religion Uncensored</div>
                <nav className="flex-1 px-4 space-y-2">
                  <Link className="block px-4 py-2 rounded-lg hover:bg-cyan-600" to="#">Dashboard</Link>
                  <Link className="block px-4 py-2 rounded-lg hover:bg-cyan-600" to="#">Posts</Link>
                  <Link className="block px-4 py-2 rounded-lg hover:bg-cyan-600" to="#">Categories</Link>
                  <Link className="block px-4 py-2 rounded-lg hover:bg-cyan-600" to="#">Users</Link>
                  <Link className="block px-4 py-2 rounded-lg hover:bg-cyan-600" to="#">Comments</Link>
                  <Link className="block px-4 py-2 rounded-lg hover:bg-red-600" to="/">Logout</Link>
                </nav>
              </aside>

              {/* Main Content */}
              <main className="flex-1 p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-3xl font-bold">Dashboard</h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600"
                        >
                        + New Post
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                  <div className="bg-white rounded-xl shadow p-6 border-t-4 border-cyan-500">
                    <h3 className="text-sm text-gray-500">Total Posts</h3>
                    <p className="text-3xl font-bold">128</p>
                  </div>
                  <div className="bg-white rounded-xl shadow p-6 border-t-4 border-yellow-400">
                    <h3 className="text-sm text-gray-500">Categories</h3>
                    <p className="text-3xl font-bold">6</p>
                  </div>
                  <div className="bg-white rounded-xl shadow p-6 border-t-4 border-red-500">
                    <h3 className="text-sm text-gray-500">Comments</h3>
                    <p className="text-3xl font-bold">342</p>
                  </div>
                  <div className="bg-white rounded-xl shadow p-6 border-t-4 border-[#0A1A2F]">
                    <h3 className="text-sm text-gray-500">Users</h3>
                    <p className="text-3xl font-bold">21</p>
                  </div>
                </div>

                {/* Recent Posts */}
                <div className="bg-white rounded-xl shadow">
                  <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Recent Posts</h2>
                    <Link className="text-cyan-600 hover:underline" to="#">View all</Link>
                  </div>
                  <table className="w-full text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-4">Title</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="4" className="p-6 text-center text-gray-500">
                            Loading posts...
                          </td>
                        </tr>
                      ) : posts.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="p-6 text-center text-gray-500">
                            No posts found
                          </td>
                        </tr>
                      ) : (
                        posts.map((post) => (
                          <tr key={post._id} className="border-t">
                            <td className="p-4 font-medium">{post.title}</td>
                            <td className="p-4">{post.category || "Uncategorized"}</td>
                            <td className="p-4">
                              <span
                                className={`px-3 py-1 rounded-full text-sm ${
                                  post.status === "draft"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {post.status || "published"}
                              </span>
                            </td>
                            <td className="p-4 space-x-3 flex items-center">
                              <button className="text-cyan-600 hover:text-cyan-700">
                                <Edit2 size={18} />
                              </button>
                              <button className="text-red-600 hover:text-red-700">
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </main>
                <CreatePostModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onPostCreated={fetchPosts}
                />
            </div>
          );
}