import React, { createContext, useContext, useEffect, useState } from "react";
import { UserContext } from "../App";
import { Navigate, useParams } from "react-router-dom";
import BlogEditor from "../components/blog-editor.component";
import PublishForm from "../components/publish-form.component";
import Loader from "../components/loader.component";
import axios from "axios";
import PageNotFound from "./404.page";

//editor context

const BlogStructure = {
  title: "",
  banner: "",
  content: [],
  tags: [],
  des: "",
  auther: { personal_info: {} },
};

export const EditorContext = createContext({});

const Editor = () => {

  let { blog_id } = useParams()


  const { setUserAuth, userAuth } = useContext(UserContext)
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    storingData();
    if (!blog_id) {
      return setLoading(false)
    }

    axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/get-blog", {
      blog_id,
      draft: true, mode: 'edit'
    }).then(({ data: { blog } }) => {
      setBlog(blog);
      setLoading(false)
    }).catch(err => {
      setBlog(null)
      setBlog(false)
    })


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

  const [blog, setBlog] = useState(BlogStructure);

  const [editorState, setEditorState] = useState("editor");
  const [textEditor, setTextEditor] = useState({ isReady: false });


  console.log(userAuth);

  return (
    <EditorContext.Provider
      value={{
        blog,
        setBlog,
        editorState,
        setEditorState,
        textEditor,
        setTextEditor,
      }}
    >
      {

        userAuth && !userAuth.isAdmin ? <Navigate to={'404'}/> :

          userAuth && userAuth.access_token === null ? (
            <Navigate to="/signin" />
          ) : loading ? <Loader /> : editorState == "editor" ? (
            <BlogEditor />
          ) : (
            <PublishForm />
          )}
    </EditorContext.Provider>
  );
};

export default Editor;
