import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { UserContext } from "../App";
import AboutUser from "../components/about.component";
import { filterpaginationData } from "../common/filter-pagination-data";
import InpageNavigation from "../components/inpage-navigation.component";
import BlogPost from "../components/blog-post.component";
import NoDataMessage from "../components/nodata.component";
import LoadMoreDataBtn from "../components/load-more.component";
import PageNotFound from "./404.page";

export const profileDataStructure = {
    personal_info: {
        fullname: "",
        username: "",
        profile_img: "",
        bio: "",
    },
    account_info: {
        total_post: 0,
        total_blog: 0,
    },

    social_links: {},
    joinedAt: "",
};

const ProfilePage = () => {

    const [blog, setBlog] = useState(null)
    const [profile, setProfile] = useState(profileDataStructure);
    let { id: profileId } = useParams();

    const [loading, setLoading] = useState(true);
    const [profileLoaded, setProfileLoaded] = useState("")



    useEffect(() => {
        if (profileId != profileLoaded) {
            setBlog(null)
        }

        if (blog == null) {
            resetState()
            fetchUserProfile();
        }


    }, [profileId, blog]);

    const resetState = () => {

        setProfile(profileDataStructure)
        setLoading(true)
        setProfileLoaded("")

    }

    const fetchUserProfile = () => {
        axios
            .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-profile", {
                username: profileId,
            })
            .then(({ data: user }) => {
                if (user != null) {

                    setProfile(user);
                }
                setProfileLoaded(profileId)
                setLoading(false);

                getBlog({ user_id: user._id })


          
            })
            .catch((err) => {
                console.log(err.message);
            });
    };

    let {
        personal_info: { fullname, username: profile_username, profile_img, bio },
        account_info: { total_posts, total_reads },
        social_links,
        joinedAt,
    } = profile;


    const getBlog = ({ page = 1, user_id }) => {
        user_id = user_id == undefined ? blog.user_id : user_id

        axios.post(import.meta.env.VITE_SERVER_DOMAIN + '/search-blog', {
            author: user_id,
            page

        }).then(async ({ data }) => {
            console.log("tha data is ", data);

            let formattedData = await filterpaginationData({
                state: blog,
                data: data.blogs,
                page,
                countRoute: '/search-blogs-count',
                data_to_send: { author: user_id }
            })

            formattedData.user_id = user_id

            setBlog(formattedData)
        })
            .catch(err => {
                console.log(err.message);
            })

    }


    let { userAuth, setUserAuth } = useContext(UserContext)
    return (
        <AnimationWrapper>
            {loading ?
                <Loader />
                :

                profile_username.length ?

                    <section className="h-cover md:flex flex-row-reverse items-start gap-5 min-[1100px]:gap:12">
                        <div className="flex flex-col max-md:items-center gap-5 min-w-[250px] md:w-[50%0 md:pl-8 md:border-l md:border-grey md:sticky md:top-[100px] md:py-10">
                            <img src={profile_img} alt="" className="w-48 h-48 bg-grey rounded-full md:w-32 md:h-32" />
                            <h1 className="text-2xl font-medium">@{profile_username}</h1>
                            <p className="text-xl capitalize h-6 ">{fullname}</p>
                            <p>{total_posts.toLocaleString()} Blogs - {total_reads.toLocaleString()} Reads</p>

                            <div className="flex gap-4 mt-2 ">

                                {
                                    profileId == userAuth.username ?
                                        <Link className="btn-light " to="/settings/edit-profile">
                                            Edit Profile

                                        </Link> : ""
                                }


                            </div>
                            <AboutUser className="max-md:hidden" bio={bio} social_links={social_links} joinedAt={joinedAt} />
                        </div>

                        <div className="max-md:mt-12 w-full ">
                            <InpageNavigation
                                routes={["blogs Published", "About"]}
                                defaultHidden={["About"]}
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

                                    <LoadMoreDataBtn state={blog} fetchDataFun={getBlog} />
                                </>

                                {/* for filter blog */}
                                <div>


                                    <AboutUser bio={bio} social_links={social_links} joinedAt={joinedAt} />



                                </div>
                            </InpageNavigation>
                        </div>
                    </section>
                    : <PageNotFound />}
        </AnimationWrapper>
    );
};

export default ProfilePage;
