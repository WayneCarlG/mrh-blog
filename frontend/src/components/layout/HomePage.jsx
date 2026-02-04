import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../api";

export default function HomePage() {
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedPosts();
  }, []);

  async function fetchFeaturedPosts() {
    try {
      const response = await api.get("/posts?featured=true");
      setFeaturedPosts(response.data);
    } catch (error) {
      console.error("Error fetching featured posts:", error);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen bg-white text-[#0a1a2f]">
      
      {/* HERO SECTION */}
      <section className="bg-[#0a1a2f] text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <img src="/logo.jpg" alt="Logo" className="w-16 h-16 mx-auto mb-4" />
            <span className="text-cyan-400">Religion Uncensored</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8">
            Unmasking the architecture of global beliefs, faith and cults.
          </p>

          <div className="flex justify-center gap-4">
            {/* <Link
              to="/blogs"
              className="bg-cyan-400 hover:bg-cyan-500 text-[#0a1a2f] font-semibold px-6 py-3 rounded-lg transition"
            >
              Read Blog
            </Link> */}
            <Link
              to="/subscribe"
              className="border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-[#0a1a2f] font-semibold px-6 py-3 rounded-lg transition"
            >
              Subscribe
            </Link>
          </div>
        </div>
      </section>
      {/* FEATURED POSTS */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">
          Featured <span className="text-cyan-500">Posts</span>
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">Loading posts...</p>
        ) : featuredPosts.length === 0 ? (
          <p className="text-center text-gray-500">No featured posts yet.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {featuredPosts.map((post) => (
              <div
                key={post._id}
                className="bg-white border border-gray-200 rounded-xl shadow hover:shadow-lg transition"
              >
                {/* Cover image */}
                <div
                  className="h-48 rounded-t-xl bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${post.coverImage || "/placeholder.jpg"})`,
                  }}
                />

                <div className="p-6">
                  <span className="inline-block text-sm font-semibold text-red-500 mb-2">
                    {post.category}
                  </span>

                  <h3 className="text-xl font-bold mb-2">
                    {post.title}
                  </h3>

                  <p className="text-gray-600 mb-4">
                    {post.excerpt}
                  </p>

                  <Link
                    to={`/blogs/${post._id}`}
                    className="text-cyan-600 font-semibold hover:underline"
                  >
                    Read More →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      {/* CATEGORIES */}
      {/* <section className="bg-gray-50 py-14">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Browse by <span className="text-yellow-500">Category</span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {["Revival for Doctrine", "Prophecy for Cults", "Fulfilments on Traditions and witchcraft", "Testimonies for Faith based Healings"].map((cat) => (
              <div
                key={cat}
                className="bg-white border-l-4 border-cyan-400 rounded-lg p-6 text-center hover:border-yellow-400 transition cursor-pointer"
              >
                <h4 className="font-bold text-lg">{cat}</h4>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* NEWSLETTER */}
      <section className="bg-[#0a1a2f] text-white py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Stay <span className="text-yellow-400">Updated</span>
          </h2>
          <p className="text-gray-300 mb-6">
            Join our newsletter and never miss our latest posts.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-3 rounded-lg text-[#0a1a2f] w-full md:w-2/3"
            />
            <button className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-lg font-semibold transition">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t py-6 text-center text-gray-500">
        © {new Date().getFullYear()} Religion Uncensored. All rights reserved.
      </footer>
    </div>
  );
}
