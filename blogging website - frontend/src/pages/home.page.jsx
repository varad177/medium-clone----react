import React, { useEffect, useState } from "react";
import AnimationWrapper from "../common/page-animation";
import InpageNavigation from "../components/inpage-navigation.component";
import axios from "axios";
import Loader from "../components/loader.component";
import BlogPost from "../components/blog-post.component";
import MinimulBlogPost from "../components/nobanner-blog-post.component";

import { activeTab } from "../components/inpage-navigation.component";
import NoDataMessage from "../components/nodata.component";
import { filterpaginationData } from "../common/filter-pagination-data";
import LoadMoreDataBtn from "../components/load-more.component";


const HomePage = () => {
  const [blog, setBlog] = useState(null);


  const [trensingblog, setTrensingBlog] = useState(null);
  let [pageState, setPageState] = useState("home");

  let categories = [
    "programming",
    "hollywood",
    "film making",
    "ai",
    "tech",
    "finance",
    "social media",
    "travel",
    "motivation"
  ];

  useEffect(() => {
    activeTab.current.click();
    if (pageState == "home") {
      fetchLatestBlog({ page: 1 });
    } else {
      fetchBlogByCategory();
    }

    if (!trensingblog) {
      fetchTrendingBlogs({ page: 1 });
    }
  }, [pageState]);

  const fetchLatestBlog = async ({ page = 1 }) => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/latest-blog", { page: page })
      .then(async ({ data }) => {

        console.log(data.blogs);

        const formattedData = await filterpaginationData({
          state: blog,
          data: data.blogs,
          page,
          countRoute: "/all-latest-blogs-count"
        })

        console.log(formattedData);
        setBlog(formattedData);
      }).catch(err => {
        console.log(err.message);

      })
  };
  const fetchBlogByCategory = (page = 1) => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blog", {
        tag: pageState,
        page
      })
      .then(async ({ data }) => {
        console.log(data.blogs);

        const formattedData = await filterpaginationData({
          state: blog,
          data: data.blogs,
          page,
          countRoute: "/search-blogs-count",
          data_to_send: { tag: pageState }
        })

        console.log(formattedData);
        setBlog(formattedData);
      });
  };

  const fetchTrendingBlogs = () => {
    axios
      .get(import.meta.env.VITE_SERVER_DOMAIN + "/trending-blog")
      .then(({ data }) => {
        console.log(data.blogs);
        setTrensingBlog(data.blogs);
      });
  };

  const loadBlogByCategory = (e) => {
    let category = e.target.innerText.toLowerCase();
    setBlog(null);

    if (pageState == category) {
      setPageState("home");
      return;
    }

    setPageState(category);
  };

  return (
    <div>
      <AnimationWrapper>
        <section className="h-cover flex justify-center gap-10 ">
          {/* latest blog */}
          <div className="w-full">
            <InpageNavigation
              routes={[pageState, "trendingBlog"]}
              defaultHidden={["trendingBlog"]}
            >
              <>
                {blog == null ? (
                  <Loader />
                ) : (

                  blog.results.length ?
                    blog.results.map((blog, i) => {
                      return (

                        <AnimationWrapper
                          key={i}
                          transition={{ duration: 1, delay: i * 0.1 }}
                        >
                          <BlogPost
                            content={blog}
                            author={blog.author.personal_info}
                          />
                        </AnimationWrapper>
                      );
                    }) : <NoDataMessage message="No Post Found" />
                )}

                <LoadMoreDataBtn state={blog} fetchDataFun={(pageState == "home" ? fetchLatestBlog : fetchBlogByCategory)} />
              </>

              {/* for filter blog */}
              <div>
                {trensingblog == null ? (
                  <Loader />
                ) : (
                  trensingblog.length ?
                    trensingblog.map((blog, i) => {
                      return (
                        <AnimationWrapper
                          key={i}
                          transition={{ duration: 1, delay: i * 0.1 }}
                        >
                          <MinimulBlogPost blog={blog} idx={i} />
                        </AnimationWrapper>
                      );
                    }) : <NoDataMessage message={"no trending blogs "} />
                )}



              </div>
            </InpageNavigation>
          </div>

          <div className="min-w-[40%] lg:min-w-[400px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden  ">
            <div className="flex flex-col gap-10 ">
              <div>
                <h1 className="font-medium text-xl mb-8">
                  Stories From All interest
                </h1>
                <div className="flex flex-wrap gap-3 ">
                  {categories &&
                    categories.map((cats, i) => {
                      return (
                        <button
                          onClick={loadBlogByCategory}
                          className={
                            "tag " +
                            (pageState == cats ? " bg-black text-white" : "")
                          }
                          key={i}
                        >
                          {cats}
                        </button>
                      );
                    })}
                </div>
              </div>

              <div>
                <h1 className="font-medium text-xl mb-8">
                  Trending <i className="fa-solid fa-arrow-trend-up"></i>
                </h1>
                {trensingblog == null ? (
                  <Loader />
                ) : (
                  trensingblog.map((blog, i) => {
                    return (
                      <AnimationWrapper
                        key={i}
                        transition={{ duration: 1, delay: i * 0.1 }}
                      >
                        <MinimulBlogPost blog={blog} idx={i} />
                      </AnimationWrapper>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>
      </AnimationWrapper>
    </div>
  );
};

export default HomePage;
