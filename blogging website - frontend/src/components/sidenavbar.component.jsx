import React, { useContext, useEffect, useRef, useState } from "react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { UserContext } from "../App";

const SideNav = () => {
    let page = location.pathname.split("/")[2];
    let [pageState, setPageState] = useState(page.replace("-", " "));
    let { setUserAuth, userAuth } = useContext(UserContext);

    useEffect(() => {
        const fetchdata = async () => {
            await storingData();
        };

        fetchdata();

        if (userAuth && userAuth.access_token) {
            setShowSideNav(false);
            pageStateTab.current.click();
        }
    }, [pageState]);

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

    let activeTabLine = useRef();

    let sideBarIcon = useRef();

    let pageStateTab = useRef();

    let [showSideNav, setShowSideNav] = useState(false);

    const changePageState = (e) => {
        let { offsetWidth, offsetLeft } = e.target;

        activeTabLine.current.style.width = offsetWidth + "px";
        activeTabLine.current.style.left = offsetLeft + "px";

        if (e.target == sideBarIcon.current) {
            setShowSideNav(true);
        } else {
            setShowSideNav(false);
        }
    };

    return userAuth && userAuth.access_token ? (
        <>
            <section className="relative flex gap-10 py-0 m-0 max-md:flex-col">
                <div className="sticky top-[80px] z-30 ">
                    <div className="md:hidden bg-white pt-1 border-b border-grey flex flex-nowrap overflow-x-auto ">
                        <button
                            onClick={changePageState}
                            ref={sideBarIcon}
                            className="p-5 capitalize "
                        >
                            <i className="fa-solid fa-bars-staggered pointer-events-none"></i>
                        </button>
                        <button
                            ref={pageStateTab}
                            onClick={changePageState}
                            className="p-5 capitalize "
                        >
                            {pageState}
                        </button>
                        <hr
                            ref={activeTabLine}
                            onClick={changePageState}
                            className="absolute bottom-0 duration-500"
                        />
                    </div>

                    <div
                        className={
                            "min-w-[200px] h-[calc(100vh-80px-60px)] md:h-cover md:sticky top-24 overflow-y-auto p-6 md:pr-0 md:border-grey md:border-r absolute max-md:top:[64px] bg-white max-md:w-[calc(100%+80px)] max-md:px-16 max-md:-ml-7 duration-500 " +
                            (!showSideNav
                                ? " max-md:opacity-0 max-md:pointer-events-none "
                                : " opacity-100 pointer-events-auto")
                        }
                    >
                        <h1 className="text-xl text-dark-grey mb-3 ">Dashboard </h1>
                        <hr className="border-grey ml-6 mb-8 mr-6 " />

                        <NavLink
                            to={"/dashboard/blogs"}
                            onClick={(e) => setPageState(e.target.innerText)}
                            className="sidebar-link"
                        >
                            <i className="fa-regular fa-file"></i>
                            Blogs
                        </NavLink>
                        <NavLink
                            to={"/dashboard/notifications"}
                            onClick={(e) => setPageState(e.target.innerText)}
                            className="sidebar-link"
                        >
                            <div className="relative">
                                <i className="fa-regular fa-bell"></i>
                                {userAuth && userAuth.new_notification_available ? (
                                    <span className="bg-red w-3 h-3 rounded-full absolute z-10 top-2 right-2 "></span>
                                ) : (
                                    ""
                                )}
                            </div>
                            Notification
                        </NavLink>
                        {
                           userAuth &&  userAuth.isAdmin && <NavLink
                                to={"/dashboard/blogs"}
                                onClick={(e) => setPageState(e.target.innerText)}
                                className="sidebar-link"
                            >
                                <i className="fa-regular fa-pen-to-square"></i>
                                Write
                            </NavLink>
                        }

                        <h1 className="text-xl text-dark-grey mb-3 mt-20 ">Settings </h1>
                        <hr className="border-grey ml-6 mb-8 mr-6 " />

                        <NavLink
                            to={"/settings/edit-profile"}
                            onClick={(e) => setPageState(e.target.innerText)}
                            className="sidebar-link"
                        >
                            <i className="fa-regular fa-user"></i>
                            Edit profile
                        </NavLink>
                        <NavLink
                            to={"/settings/change-password"}
                            onClick={(e) => setPageState(e.target.innerText)}
                            className="sidebar-link"
                        >
                            <i className="fa-solid fa-lock"></i>
                            Change Password
                        </NavLink>
                    </div>
                </div>

                <div className="max-md:-mt-8 mt-5 w-full">
                    <Outlet />
                </div>
            </section>
        </>
    ) : (
        <Navigate to="/signin" />
    );
};

// http://localhost:5173/signin
// http://localhost:5173/signin
export default SideNav;
