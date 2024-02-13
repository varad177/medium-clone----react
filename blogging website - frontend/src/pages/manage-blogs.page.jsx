import axios from "axios";
import React, { useEffect, useState } from "react";
import { useContext } from "react";
import { UserContext } from "../App";
import { filterpaginationData } from "../common/filter-pagination-data";
import InpageNavigation from "../components/inpage-navigation.component";
import Loader from "../components/loader.component";
import NoDataMessage from "../components/nodata.component";
import AnimationWrapper from "../common/page-animation";
import { ManagePublishBlogCard, ManageDraftBlogCard } from "../components/manage-blogcard.component";
import LoadMoreDataBtn from "../components/load-more.component";
import { useSearchParams } from "react-router-dom";

const ManageBlog = () => {
  const { userAuth } = useContext(UserContext);

  const [blogs, setBlogs] = useState(null);
  const [drafts, setDrafts] = useState(null);

  const [query, setQuery] = useState("");

  let activeTab = useSearchParams()[0].get('tab')

  const getBlogs = ({ page, draft, deletedDocsCount = 0 }) => {
    axios
      .post(
        import.meta.env.VITE_SERVER_DOMAIN + "/user-return-blogs",
        {
          page,
          draft,
          query,
          deletedDocsCount,
        },
        {
          headers: {
            Authorization: `Bearer ${userAuth && userAuth.access_token}`,
          },
        }
      )
      .then(async ({ data }) => {
        let formattedData = await filterpaginationData({
          state: draft ? drafts : blogs,
          data: data,
          page,
          user: userAuth && userAuth.access_token,
          countRoute: "/user-written-blogs-count",
          data_to_send: {
            draft,
            query,
          },
        });

        console.log(formattedData);

        if (draft) {
          setDrafts(formattedData);
        } else {
          setBlogs(formattedData);
        }
      })
      .catch((err) => {
        console.log(err.message);
      });
  };

  useEffect(() => {
    if (userAuth && userAuth.access_token) {
      if (blogs == null) {
        getBlogs({ page: 1, draft: false });
      }

      if (drafts == null) {
        getBlogs({ page: 1, draft: true });
      }
    }
  }, [userAuth && userAuth.access_token, blogs, drafts, query]);

  const handleSearch = (e) => {
    let searchQuery = e.target.value;

    setQuery(searchQuery);

    if (e.keyCode == 13 && searchQuery.length) {
      setBlogs(null);
      setDrafts(null);
    }
  };
  const handleChange = (e) => {
    if (!e.target.value.length) {
      setQuery("");
      setBlogs(null);
      setDrafts(null);
    }
  };

  return (
    <>
      <h1 className="max-md:hidden ">Manage Blogs</h1>

      <div className="relative max-md:mt-5 mt-8 mb-10 ">
        <input
          onChange={handleChange}
          onKeyDown={handleSearch}
          type="search"
          placeholder="Search Blogs"
          className="w-full p-4  bg-grey pl-12 pr-6 rounded-full placeholder:text-dark-grey  "
        />
        <i className="fa-solid fa-magnifying-glass absolute right-[10%] md:pointer-events-none md:left-5 top-1/2 -translate-y-1/2 text-xl text-dark-grey "></i>
      </div>

      <InpageNavigation routes={["published Blog", "draft"]} defaultActiveindex={activeTab != 'draft' ? 0 : 1}>
        {blogs == null ? (
          <Loader />
        ) : blogs.results.length ? (
          <>
            {blogs.results.map((blog, i) => {
              return (
                <AnimationWrapper
                  key={i}
                  transition={{
                    delay: i * 0.04,
                  }}
                >
                  <ManagePublishBlogCard blog={{ ...blog, index: i, setStateFunc: setBlogs }} />
                </AnimationWrapper>
              );
            })}


            <LoadMoreDataBtn state={blogs} fetchDataFun={getBlogs} additionalParams={{ draft: false, deletedDocsCount: blogs.deletedDocsCount }} />

          </>
        ) : (
          <NoDataMessage message={"no published blog"} />
        )}


        {drafts == null ? (
          <Loader />
        ) : drafts.results.length ? (
          <>
            {drafts.results.map((blog, i) => {
              return (
                <AnimationWrapper
                  key={i}
                  transition={{
                    delay: i * 0.04,
                  }}
                >
                  <ManageDraftBlogCard blog={{ ...blog, index: i, setStateFunc: setDrafts }} index={i + 1} />
                </AnimationWrapper>
              );
            })}

            <LoadMoreDataBtn state={drafts} fetchDataFun={getBlogs} additionalParams={{ draft: true, deletedDocsCount: drafts.deletedDocsCount }} />
          </>
        ) : (
          <NoDataMessage message={"no published blog"} />
        )}
      </InpageNavigation>
    </>
  );
};

export default ManageBlog;
