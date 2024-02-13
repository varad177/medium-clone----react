import React, { useContext, useEffect, useState } from "react";
import darklogo from '../imgs/logo-dark.png'
import lightlogo from '../imgs/logo-light.png'
import { Link, Outlet, useNavigate } from "react-router-dom";
import { ThemeContext, UserContext } from "../App";
import UserNavigationPanel from "./user-navigation.component";
import axios from "axios";
import { storeInSession } from "../common/session";

const NavBar = () => {
  const [searchBox, setSearchBox] = useState(false);

  const [userNavPanel, setUserNavPanel] = useState(false);

  const { userAuth, setUserAuth } = useContext(UserContext);


  const handleUserNavPanel = () => {
    setUserNavPanel((currvalue) => !currvalue);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setUserNavPanel(false);
    }, 200);
  };

  const navigate = useNavigate()

  const handleSearch = (e) => {
    let query = e.target.value

    if (e.keyCode == 13 && query.length) {
      navigate(`/search/${query}`)
    }



  }

  useEffect(() => {
    storingData();

    if (userAuth && userAuth.access_token) {
      axios.get(import.meta.env.VITE_SERVER_DOMAIN + '/new-notification', {
        headers: {
          'Authorization': `Bearer ${userAuth.access_token}`
        }
      }).then(({ data }) => {
        setUserAuth(prevState => ({
          ...prevState,
          new_notification_available: data.new_notification_available
        }));
        console.log(userAuth);
      }).catch(err => {
        console.log(err.message);
      });
    }
  }, [userAuth && userAuth.access_token]);

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



  let { theme, setTheme } = useContext(ThemeContext)


  const changeTheme = () => {

    let newTheme = theme == 'light' ? 'dark' : 'light'
    setTheme(newTheme)

    document.body.setAttribute('data-theme', newTheme)
    storeInSession('theme', newTheme);

  }



  return (
    <>
      <nav className="navbar z-50">
        <Link to="/">
          <img className="flex-none w-10" src={theme == 'light' ? darklogo : lightlogo} alt="" />
        </Link>





        <div
          className={
            "absolute md:show  bg-white w-full left-0 top-full mt-0.5 border-b border-grey py-4 px-[5vw] md:bottom-0 md:block md:relative md:inset-0 md:p-0 md:w-auto " +
            (searchBox ? "show" : "hide")
          }
        >
          <input
            type="text"
            placeholder="Search"
            className="w-full  md:w-auto bg-grey p-4 pl-6 pr-[-12%] md:pr-6 rounded-full placeholder:text-dark-grey md:pl-12"
            onKeyDown={handleSearch}
          />
          <i className="fa-solid fa-magnifying-glass absolute my-3 right-[10%] md:pointer-events-none md:left-5 translate-y-1/2 text-xl text-dark-grey "></i>
        </div>

        <div className="flex items-center gap-3 md:gap-6 ml-auto">
          <button
            onClick={() => {
              setSearchBox((currentVal) => !currentVal);
            }}
            className=" flex items-center justify-center md:hidden text-xl w-12 h-12 rounded-full bg-grey "
          >
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>

          {
            userAuth && userAuth.isAdmin && <Link to="/editor" className="hidden md:visible md:flex gap-2 link">
              <i className="fa-solid fa-file-pen"></i>
              <p>write</p>
            </Link>
          }
          <button onClick={changeTheme} className="w-12 h-12 rounded-full bg-grey relative hover:bg-black/10">
            <i className={"fa-regular fa-" + (theme == 'light' ? 'moon' : 'sun') + " text-2xl block mt-1"}></i>


          </button>

          {userAuth && userAuth.access_token ? (
            <>
              <Link to="/dashboard/notifications">
                <button className="w-12 h-12 rounded-full bg-grey relative hover:bg-black/10">
                  <i className="fa-regular fa-bell text-2xl mt-1 block "></i>
                  {
                    userAuth && userAuth.new_notification_available ? <span className="bg-red w-3 h-3 rounded-full absolute z-10 top-2 right-2 "></span>
                      : ""

                  }                </button>
              </Link>

              <div
                className="relative"
                onClick={handleUserNavPanel}
                onBlur={handleBlur}
              >
                <button className="w-12 h-12 mt-1">
                  <img
                    className="w-full h-full object-cover rounded-full"
                    src={userAuth.profile_img}

                  />
                </button>
                {userNavPanel ? <UserNavigationPanel /> : ""}
              </div>
            </>
          ) : (
            <>
              <Link className="btn-dark py-2 " to="/signin">
                sign-In
              </Link>
              <Link className="btn-light py-2 hidden md:block" to="/signup">
                sign-up
              </Link>
            </>
          )}
        </div>
      </nav>

      <Outlet />
    </>
  );
};

export default NavBar;
