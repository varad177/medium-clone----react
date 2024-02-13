import React, { useContext } from "react";
import AnimationWrapper from "../common/page-animation";
import { Link } from "react-router-dom";
import { UserContext } from "../App";
import { removedFromSession } from "../common/session";

const UserNavigationPanel = () => {

  const { userAuth, setUserAuth } = useContext(UserContext);


  const signOutUser = () => {
    removedFromSession("user")
    setUserAuth({ access_token: null })

  }

  return (
    <AnimationWrapper className="absolute right-0 z-50 " transition={{ duration: 0.2 }}>
      <div className="bg-white absolute right-0 border border-grey w-60  duration-200 ">
        {
          userAuth && userAuth.isAdmin ? <Link to="editor" className="flex gap-2 link md:hidden py-4 pl-8 ">
            <i class="fa-solid fa-file-pen"></i>
            <p>Write</p>
          </Link> : ""
        }
        <Link className=" link pl-8 py-4" to={`/user/${userAuth.username}/`}>
          Profile
        </Link>
        <Link to="/settings/edit-profile" className="link pl-8 py-4">
          Settings
        </Link>

        <span className="absolute border-t border-grey  w-[200%]">

        </span>

        <button onClick={signOutUser} className="text-left p-4 hover:bg-grey w-full pl-8 py-4 ">
          <h1 className="font-bold text-xl mb-1 ">sign out</h1>
          <p className="text-dark-grey">@{userAuth.username}</p>
        </button>
      </div>
    </AnimationWrapper>
  );
};

export default UserNavigationPanel;
