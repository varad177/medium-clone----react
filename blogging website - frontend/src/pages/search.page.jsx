

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import InpageNavigation from '../components/inpage-navigation.component'
import Loader from '../components/loader.component'
import AnimationWrapper from '../common/page-animation'
import BlogPost from '../components/blog-post.component'
import NoDataMessage from '../components/nodata.component'
import LoadMoreDataBtn from '../components/load-more.component'
import axios from 'axios'
import { filterpaginationData } from '../common/filter-pagination-data'
import UserCard from '../components/usercard.component'



const SearchPage = () => {

    const { query } = useParams()

    const [blog, setBlog] = useState(null);

    const [user, setUser] = useState(null)

    useEffect(() => {

        resetState()
        searchBlogs({ page: 1, create_new_arr: true })
        fetchUser()

    }, [query])

    const fetchUser = () => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/search-users", { query })
            .then(({ data: { users } }) => {
                console.log(users);
                setUser(users)
            })
    }

    const resetState = () => {
        setUser(null)
        setBlog(null)
    }

    const searchBlogs = ({ page = 1, create_new_arr = false }) => {

        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blog", { query, page })
            .then(async ({ data }) => {

                console.log(data.blogs);

                const formattedData = await filterpaginationData({
                    state: blog,
                    data: data.blogs,
                    page,
                    countRoute: "/search-blogs-count",
                    data_to_send: { query },
                    create_new_arr
                })

                console.log(formattedData);
                setBlog(formattedData);
            }).catch(err => {
                console.log(err.message);

            })

    }

    const UserCardWrapper = () => {
        return (
            <>

                {



                    user == null ? <Loader /> :
                        user.length ?
                            user.map((user, i) => {
                                return <AnimationWrapper key={i} transition={{ duration: 1, delay: i * 0.08 }}>
                                    <UserCard user={user} />

                                </AnimationWrapper>
                            })

                            : <NoDataMessage message={"no user found"} />


                }

            </>
        )
    }

    return (
        <div>
            <section className='h-cover flex justify-center gap-10 '>

                <div className='w-full '>
                    <InpageNavigation routes={[`search result for ${query}`, "Account Matched"]} defaultHidden={["Account Matched"]}>

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

                            <LoadMoreDataBtn state={blog} fetchDataFun={searchBlogs} />
                        </>

                        <UserCardWrapper />



                    </InpageNavigation>

                </div>

                <div className='min-w-[40%] lg:min-w-[350px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden '>

                    <h1 className='font-medium text-xl mb-8 '>
                        user related to search
                        <i class="fa-regular fa-user mt-1 ml-1 "></i>

                    </h1>

                    <UserCardWrapper />



                </div>

            </section>

        </div>
    )
}

export default SearchPage
