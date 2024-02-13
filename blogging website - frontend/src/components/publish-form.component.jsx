import React, { useContext, useEffect } from "react";
import AnimationWrapper from "../common/page-animation";
import { EditorContext } from "../pages/editor.pages";
import Tags from "./tags.component";
import toast from "react-hot-toast";
import axios from "axios";
import { UserContext } from "../App";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

const PublishForm = () => {

  let { blog_id } = useParams()

  const {
    userAuth: { access_token }, userAuth,
    setUserAuth
  } = useContext(UserContext);


  useEffect(() => {
    // get user data if it exists in local storage
    // userInSession
    //   ? setUserAuth(userInSession)
    //   : setUserAuth({ access_token: null });

    storingData();
  }, []);

  const storingData = async () => {
    try {
      let userInSession = await sessionStorage.getItem("user");
      console.log(userInSession);
      if (userInSession) {
        setUserAuth(JSON.parse(userInSession));
      } else {
        setUserAuth({ access_token: null });
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const navigate = useNavigate()
  let characterLength = 200;
  let tagLimit = 10;
  const {
    blog: { banner, tags, title, des, content },
    setEditorState,
    setBlog,
    blog,
  } = useContext(EditorContext);


  const handleClosed = () => {
    setEditorState("editor");
  };

  const handleBlogTitleChange = (e) => {
    e.preventDefault();
    let input = e.target;
    setBlog({
      ...blog,
      title: input.value,
    });
  };

  const handleBogdecsriptionChange = (e) => {
    e.preventDefault();
    let input = e.target;

    setBlog({
      ...blog,
      des: input.value,
    });
  };

  const handleTitleKeyDowm = (e) => {
    if (e.keyCode == 13) {
      e.preventDefault();
    }
  };

  const handleKeyDown = (e) => {
    if (e.keyCode == 13 || e.keyCode == 188) {
      e.preventDefault();
      let tag = e.target.value;
      if (tags.length < tagLimit) {
        if (!tags.includes(tag) && tag.length) {
          setBlog({
            ...blog,
            tags: [...tags, tag],
          });
        }
      } else {
        toast.error(`you can max ${tagLimit} tags`);
      }

      e.target.value = "";
    }
  };
  // 188 , 13

  const handlePublishBlog = (e) => {
    if (e.target.className.includes("disable")) {
      return;
    }
    if (!title.length) {
      return toast.error("write a title before publishing");
    }

    if (!des.length || des.length > 200) {
      return toast.error(
        `please write some description under ${characterLength} character`
      );
    }

    if (!tags.length) {
      return toast.error("add at least one tag to rank your tags ");
    }

    let loadingToast = toast.loading("publishing post....");

    e.target.classList.add("disable");

    let blogOBJ = {
      title,
      banner,
      content,
      tags,
      des,
      draft: false,
    };

    console.log(blog_id);

    axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/create-blog", { ...blogOBJ, id: blog_id }, {
      headers: {
        Authorization: `Bearer ${userAuth.access_token}`,
      },
    }).then(() => {
        e.target.classList.remove("disable");
        toast.dismiss(loadingToast)

        toast.success("published 👍")

        setTimeout(() => {
          navigate('/dashboard/blogs')
        }, 500);



    })
      .catch(({ response }) => {
         e.target.classList.remove("disable");
         toast.dismiss(loadingToast)

         return toast.error(response.data.error)
      })
  };
  return (
    <AnimationWrapper>
      <section className="w-screen min-h-screen grid items-center lg:grid-cols-2 py-16 lg:gap-4 ">
        <button
          onClick={handleClosed}
          className="w-12 h-12 right-[5vw] z-10 absolute top-[5%] lg:top-[10%]"
        >
          <i className="fa-solid fa-xmark "></i>
        </button>
        <div className="max-w-[550px] center mt-4">
          <p className="text-dark-grey mb-1 ">Preview</p>
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4">
            <img src={banner} className="" alt="" />
          </div>

          <h1 className=" text-4xl font-medium mt-2 leading-tight line-clamp-2 ">
            {title}
          </h1>
          <p className="font-gelasio line-clamp-2 text-xl leading-7 mt-4">
            {des}
          </p>
        </div>

        <div className="border-grey lg:border-1 lg:pl-8">
          <p className="text-dark-grey mb-2 mt-9 ">Blog Title</p>
          <input
            type="text"
            placeholder="Blog Title"
            defaultValue={title}
            className="input-box pl-4"
            onChange={handleBlogTitleChange}
          />

          <p className="text-dark-grey mb-2 mt-9 ">
            Short Description about your blog
          </p>

          <textarea
            onKeyDown={handleTitleKeyDowm}
            className="h-40 resize-none leading-7 pl-4 input-box "
            maxLength={characterLength}
            defaultValue={des}
            onChange={handleBogdecsriptionChange}
          ></textarea>
          <p className="mt-1 text-dark-grey text-sm text-right">
            {characterLength - des.length} character Left
          </p>

          <p className="text-dark-grey mb-2 mt-9 ">
            Topics - (help in searching and ranking your blog post)
          </p>

          <div className="relative input-box py-2 pb-4 ">
            <input
              type="text"
              placeholder="Topics"
              className="sticky input-box bg-white top-0 left-0 pl-4 mb-3 focus:bg-white"
              onKeyDown={handleKeyDown}
            />
            {tags.map((tag, i) => {
              return <Tags tag={tag} tagIndex={i} key={i} />;
            })}
          </div>
          <p className="text-sm text-dark-grey text-right mt-1 mb-4 ">
            {" "}
            {tagLimit - tags.length} tags left
          </p>

          <button onClick={handlePublishBlog} className="btn-dark px-8">
            Publish
          </button>
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default PublishForm;
