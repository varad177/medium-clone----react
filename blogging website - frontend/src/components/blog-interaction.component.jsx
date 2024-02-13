import React, { useEffect } from "react";
import { useContext } from "react";
import { BlogContext } from "../pages/blog.page";
import { Link } from "react-router-dom";
import { UserContext } from "../App";
import toast from "react-hot-toast";
import axios from "axios";

const BlogInteraction = () => {
    let { blog,
        blog: {
            _id,
            title,
            blog_id,
            activity,
            activity: { total_likes, total_comments },
            author: {
                personal_info: { username: author_username },
            },
        },
        setBlog,
        isLikedByUser,
        SetisLikedByUser,
        commentWrapper, setCommentWrapper
    } = useContext(BlogContext);


    let { userAuth: { username, access_token } } = useContext(UserContext)

    useEffect(() => {

        if (access_token) {
            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/isliked-by-user", {
                _id
            },
                {
                    headers: {
                        'Authorization': `Bearer ${access_token}`
                    }
                }).then(({ data: { result } }) => {
                    SetisLikedByUser(Boolean(result))
                }).catch(err => {
                    console.log(err.message);
                })
        }

    }, [])

    const handleLike = () => {
        if (access_token) {
            SetisLikedByUser(currentval => !currentval)

            !isLikedByUser ? total_likes++ : total_likes--;
            setBlog({ ...blog, activity: { ...activity, total_likes } })

            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/like-blog", {
                _id, isLikedByUser
            }, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            }).then(({ data }) => {
                console.log(data);
            }).catch(err => {
                console.log(err.message);
            })
        }
        else {
            toast.error("pleased log in to like this blog")
        }

    }


    return (
        <>
            <hr className="border border-grey my-2 " />
            <div className="flex gap-6 justify-between">
                <div className="flex gap-3 items-center">
                    <button onClick={handleLike} className={"w-10 h-10 rounded-full flex items-center justify-center " + (isLikedByUser ? "bg-red/20 text-red" : "bg-grey/80")}>
                        <i className={"fa-" + (isLikedByUser ? "solid " : "regular ") + "fa-heart"}></i>
                    </button>
                    <p className="text-xl text-dark-grey">{total_likes}</p>


                    <button onClick={()=>setCommentWrapper(preval => !preval)} className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80">
                        <i class="fa-regular fa-comment"></i>
                    </button>
                    <p className="text-xl text-dark-grey">{total_comments}</p>
                </div>

                <div className="flex gap-6 items-center">

                    {
                        username == author_username ? <Link className="underline hover:text-purple" to={`/editor/${blog_id}`}>
                            Edit
                        </Link> : ""
                    }

                    <Link to={`https://twitter.com/intent/tweet?text=Read${title}&url=${location.href}`}>
                        <i className="fa-brands fa-twitter text-xl hover:text-twitter"></i>
                    </Link>
                </div>
            </div>

            <hr className="border border-grey my-2" />
        </>
    );
};

export default BlogInteraction;
