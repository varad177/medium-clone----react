
import axios from 'axios'
import React, { createContext, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AnimationWrapper from '../common/page-animation'
import Loader from '../components/loader.component'
import { getDay } from '../common/date'
import BlogInteraction from '../components/blog-interaction.component'
import BlogPost from '../components/blog-post.component'
import BlogContent from '../components/blog-content.component'
import CommentContainer, { fetchComments } from '../components/comments.component'

export const BlogStructure = {

    title: "",
    des: "",
    content: [],
    tags: [],
    author: { personal_info: {} },
    banner: "",
    publishedAt: ""
}

export const BlogContext = createContext({})


const BlogPage = () => {
    let { blog_id } = useParams()
    const navigate = useNavigate()

     const [commentWrapper , setCommentWrapper] = useState(false
        )

        const [totalParentCommentLoaded , setTotalParentCommentLoaded] = useState(1)
        console.log(totalParentCommentLoaded);



    const [blog, setBlog] = useState(BlogStructure)
    const [similarBlog, SetSimilarBlog] = useState(null)
    const [loading, setLoading] = useState(true)
    let [isLikedByUser, SetisLikedByUser] = useState(false)

    let { title, content, banner, author: { personal_info: { fullname, username: author_username, profile_img } }, publishedAt, tags } = blog



    useEffect(() => {

        resetState();

        fetchBlog({ blog_id })

    }, [blog_id])

    const resetState = () => {
        setBlog(BlogStructure);
        SetSimilarBlog(null)
        setLoading(true)
        SetisLikedByUser(false)
         setCommentWrapper(false)
        setTotalParentCommentLoaded(0)
    }

    const fetchBlog = () => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/get-blog", { blog_id })
            .then( async({ data: { blog } }) => {

                console.log("before --> ", blog.comments);
              
                blog.comments = await fetchComments({
                    blog_id : blog._id  , setParentCommentCountFun : setTotalParentCommentLoaded 

                })

                setBlog(blog)
                console.log("after --> ", blog.comments);


                axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blog", {
                    tag: blog.tags[0], limit: 6,
                    eliminate_blog: blog_id
                }).then(({ data }) => {
                    console.log(data.blogs);
                    SetSimilarBlog(data.blogs);

                })


                setLoading(false)
            })
            .catch(err => {
                console.log(err.message);
            })
    }


    return (

        <AnimationWrapper>

            {
                loading ? <Loader /> :
                    <BlogContext.Provider value={{ blog, setBlog, SetisLikedByUser, isLikedByUser , setTotalParentCommentLoaded , totalParentCommentLoaded , commentWrapper , setCommentWrapper }}>

                        <CommentContainer/>
                        <div className='max-w-[900px] center py-10 max-lg:px-[5vw]'>

                            <img src={banner} className='aspect-video ' />

                            <div className="mt-12 ">


                                <h2>
                                    {title}
                                </h2>

                                <div className='flex max-sm:flex-col justify-between my-8 '>
                                    <div className='flex gap-5 items-start '>
                                        <img onClick={() => {
                                            navigate(`/user/${author_username}`)
                                        }} className='w-12 h-12 rounded-full' src={profile_img} />
                                        <p className='capitalize'>{fullname}
                                            <br />
                                            @
                                            <Link className='underline' to={`/user/${author_username}`}>{author_username}</Link>
                                        </p>
                                    </div>

                                    <p className='text-dark-grey opacity-75 max-sm:mt-6 max-sm:ml-12 max-sm:pl-5'>Publish on {getDay(publishedAt)}</p>
                                </div>

                            </div>


                            <BlogInteraction />

                            <div className='my-12 font-gelasio blog-page-content'>
                                {

                                    content[0].blocks.map((block, i) => {
                                        return <div key={i} className='my-4 md:my-8 '>
                                            <BlogContent block={block} />

                                        </div>
                                    })
                                }


                            </div>



                            <BlogInteraction />
                            {
                                similarBlog != null && similarBlog.length ? <>
                                    <h1 className='text-2xl mt-14 mb-10 font-medium' >
                                        Similar Blog</h1>

                                    {
                                        similarBlog && similarBlog.map((blog, i) => {
                                            let { author: { personal_info } } = blog

                                            return <AnimationWrapper key={i} transition={{ duration: 1, delay: i * 0.08 }}>
                                                <BlogPost content={blog} author={personal_info} />

                                            </AnimationWrapper>
                                        })
                                    }
                                </>
                                    : ""
                            }



                        </div>
                    </BlogContext.Provider>
            }
        </AnimationWrapper>
    )
}

export default BlogPage
