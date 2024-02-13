import { Route, Routes } from "react-router-dom";
import NavBar from "./components/navbar.component";
import UserAuthForm from "./pages/userAuthForm.page";
import { createContext, useEffect, useState } from "react";
import { lookInSession } from "./common/session";
import Editor from "./pages/editor.pages";
import HomePage from "./pages/home.page";
import SearchPage from "./pages/search.page";
import PageNotFound from "./pages/404.page";
import ProfilePage from "./pages/profile.page";
import BlogPage from "./pages/blog.page";
import SideNav from "./components/sidenavbar.component";
import ChangePassWord from "./pages/change-password.page";
import EditProfile from "./pages/edit-profile.page";
import Notifications from "./pages/notifications.page";
import ManageBlog from "./pages/manage-blogs.page";

export const UserContext = createContext({});
export const ThemeContext = createContext({})

const darkThemePreference = () => window.matchMedia("(prefers-color-scheme: dark)").matches


const App = () => {
  const [userAuth, setUserAuth] = useState();

  const [theme, setTheme] = useState(()=>darkThemePreference ? 'dark' : 'light')

  useEffect(() => {
    // get user data if it exists in local storage
    // userInSession
    //   ? setUserAuth(userInSession)
    //   : setUserAuth({ access_token: null });

    storingData();


    document.body.setAttribute('data-theme', theme);

  }, []);

  const storingData = async () => {
    try {
      let userInSession = await sessionStorage.getItem("user");
      let themeInSession = sessionStorage.getItem('theme')
      console.log(userInSession);
      if (userInSession) {
        setUserAuth(JSON.parse(userInSession));
      } else {
        setUserAuth({ access_token: null });
      }

      if (themeInSession) {
        setTheme(() => {
          document.body.setAttribute('data-theme', themeInSession)
          return themeInSession
        })
      }
      else{
        document.body.setAttribute('data-theme', theme)

      }

    } catch (error) {
      console.log(error.message);
    }
  };





  return (

    <ThemeContext.Provider value={{ theme, setTheme }}>
      <UserContext.Provider value={{ userAuth, setUserAuth }}>
        <Routes>
          <Route path="/editor" element={<Editor />} />
          <Route path="/editor/:blog_id" element={<Editor />} />
          <Route path="/" element={<NavBar />}>
            <Route index element={<HomePage />} />
            <Route path="dashboard" element={<SideNav />}>
              <Route path="blogs" element={< ManageBlog />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
            <Route path="settings" element={<SideNav />}>
              <Route path="edit-profile" element={<EditProfile />} />
              <Route path="change-password" element={<ChangePassWord />} />
            </Route>
            <Route path="signin" element={<UserAuthForm type={"sign-in"} />} />
            <Route path="signup" element={<UserAuthForm type={"sign-up"} />} />
            <Route path="search/:query" element={<SearchPage />} />
            <Route path="user/:id" element={<ProfilePage />} />
            <Route path="blog/:blog_id" element={<BlogPage />} />

            <Route path="*" element={<PageNotFound />} />
          </Route>
        </Routes>
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;
