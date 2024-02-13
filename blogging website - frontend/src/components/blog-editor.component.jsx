import React, { useContext, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import darklogo from '../imgs/logo-dark.png'
import lightlogo from '../imgs/logo-light.png'
import AnimationWrapper from "../common/page-animation";

import darkBanner from "../imgs/blog banner dark.png";
import lightBanner from "../imgs/blog banner light.png";
import { uploadImage } from "../common/aws";
import toast from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import EditorJS from "@editorjs/editorjs";
import { tools } from "./tools.component";
import axios from "axios";
import { ThemeContext, UserContext } from "../App";

const BlogEditor = () => {
  let { theme, setTheme } = useContext(ThemeContext)

  const { blog_id } = useParams()

  useEffect(() => {
    if (!textEditor.isReady) {
      setTextEditor(
        new EditorJS({
          holderId: "text-Editor",
          data: Array.isArray(content) ? content[0] : content,
          tools: tools,
          placeholder: "Lets write a blog",
        })
      );
    }
  }, []);

  let {
    blog,
    blog: { title, banner, content, tags, des },
    setBlog,
    setTextEditor,
    textEditor,
    setEditorState,
  } = useContext(EditorContext);
  console.log(content[0]);

  const handleBannerUpload = (e) => {
    e.preventDefault();
    console.log(e);
    let img = e.target.files[0];
    if (img) {
      let loadingToast = toast.loading("uploading...");
      uploadImage(img)
        .then((url) => {
          if (url) {
            toast.dismiss(loadingToast);
            toast.success("uploaded 👍");

            setBlog({ ...blog, banner: url });
          }
        })
        .catch((err) => {
          toast.dismiss(loadingToast);
          return toast.error(err.message);
        });
    }
  };

  const handleTitleKeyDowm = (e) => {
    if (e.keyCode == 13) {
      e.preventDefault();
    }
  };

  const handleTitleChange = (e) => {
    console.log(e);
    let input = e.target;
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";

    setBlog({ ...blog, title: input.value });
  };

  const handleErrorImg = (e) => {
    let img = e.target;
    img.src = theme == 'light' ? lightBanner : darkBanner;
  };

  const handlePublishEvent = () => {
    if (!banner.length) {
      return toast.error("upload blog banner to publish it ");
    }
    if (!title.length) {
      return toast.error("write blog title to publish it ");
    }

    if (textEditor.isReady) {
      textEditor
        .save()
        .then((data) => {
          if (data.blocks.length) {
            setBlog({
              ...blog,
              content: data,
            });

            setEditorState("published");
          } else {
            return toast.error("write somwthing to publich");
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const {
    userAuth,
    setUserAuth,
  } = useContext(UserContext);

  const navigate = useNavigate();

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

  const handleSaveDraft = (e) => {
    if (e.target.className.includes("disable")) {
      return;
    }
    if (!title.length) {
      return toast.error("write a title before saving it as a draft");
    }

    let loadingToast = toast.loading("saving draft....");

    e.target.classList.add("disable");

    if (textEditor.isReady) {
      textEditor.save().then((content) => {
        let blogOBJ = {
          title,
          banner,
          content,
          tags,
          des,
          draft: true,
        };
        axios
          .post(import.meta.env.VITE_SERVER_DOMAIN + "/create-blog", { ...blogOBJ, id: blog_id }, {
            headers: {
              Authorization: `Bearer ${userAuth.access_token}`,
            },
          })
          .then(() => {
            e.target.classList.remove("disable");
            toast.dismiss(loadingToast);

            toast.success("saved 👍");

            setTimeout(() => {
              navigate("/dashboard/blogs?tab=draft");
            }, 500);
          })
          .catch(({ response }) => {
            e.target.classList.remove("disable");
            toast.dismiss(loadingToast);

            return toast.error(response.data.error);
          });
      });
    }
  };


  return (
    <>
      <nav className="navbar">
        <Link to="/" className="flex-none w-10">
          <img className="" src={theme == 'light' ? darklogo : lightlogo} alt="" />
        </Link>

        <p className="max-md:hidden text-black line-clamp-1 w-full">
          {title.length ? title : "New Blog"}
        </p>

        <div className="flex gap-4 ml-auto ">
          <button onClick={handlePublishEvent} className="btn-dark py-2 ">
            Publish
          </button>
          <button onClick={handleSaveDraft} className="btn-light py-2 ">
            Save Draft
          </button>
        </div>
      </nav>

      <AnimationWrapper>
        <section>
          <div className="mx-auto max-w-[900px] w-full ">
            <div className="relative aspect-video bg-white border-grey border-4 hover:opacity-80">
              <label htmlFor="upload_banner">
                <img
                  onError={handleErrorImg}
                  className="z-20 "
                  src={banner}
                  alt=""
                />
                <input
                  id="upload_banner"
                  type="file"
                  accept=".png , .jpg , .jpeg"
                  hidden
                  onChange={handleBannerUpload}
                />
              </label>
            </div>

            <textarea
              defaultValue={title}
              placeholder="Blog Title"
              className=" bg-white text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-[40%]"
              onKeyDown={handleTitleKeyDowm}
              onChange={handleTitleChange}
            ></textarea>

            <hr className="w-full opacity-10 m-5 " />

            <div id="text-Editor" className="font-gelasio"></div>
          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};

export default BlogEditor;
