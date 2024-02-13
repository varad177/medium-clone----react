

import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDay } from '../common/date'
import { UserContext } from '../App'
import axios from 'axios'

const BlogStats = ({ stats }) => {

    return (
        <div className='flex gap-2 '>
            {
                Object.keys(stats).map((info, i) => {
                    return !info.includes('parent') ?
                        <div key={i} className={'flex flex-col items-center w-full h-full justify-center p-4 px-6 ' + (i != 0 ? " border-grey border-l " : "")}>
                            <h1 className='text-xl lg:text-2xl mb-2'>{stats[info].toLocaleString()}</h1>
                            <p className='max-lg:text-dark-grey capitalize '>{info.split('_')[1]}</p>



                        </div> : ""

                })
            }

        </div>

    )

}

export const ManagePublishBlogCard = ({ blog }) => {

    let { banner, blog_id, title, publishedAt, activity } = blog

    const [showStat, setShowStat] = useState(false)
    let { userAuth } = useContext(UserContext)


    return (
        <>
            <div className='flex max-lg:flex-col gap-10 border-b mb-6 max-md:px-4 border-grey pb-6 items-center'>
                <img className='max-md:hidden lg:hidden xl:block w-28 h-28 flex-none bg-grey object-cover' src={banner} alt="loading" />

                <div className='flex flex-col justify-between py-2 w-full min-w-[300px] '>
                    <div>
                        <Link to={`/blog/${blog_id}`} className='blog-title mv- hover:underline  '>{title}</Link>
                        <p className='line-clamp-1'>Published At {getDay(publishedAt)}</p>
                    </div>

                    <div className='flex gap-6 mt-3 '>
                        <Link to={`/editor/${blog_id}`} className='pr-4 py-2 underline'>Edit</Link>

                        <button onClick={() => setShowStat(preval => !preval)} className='ld:hidden pr-4 py-2 underline '>Stats</button>
                        <button onClick={(e) => deleteBlog(blog, userAuth , e.target)} className='pr-4 py-2 underline text-red'>Delete</button>

                    </div>





                </div>
                <div className='max-lg:hidden'>

                    <BlogStats stats={activity} />

                </div>

                {
                    showStat ? <div className='lg:hidden'>
                        <BlogStats stats={activity} />
                    </div> : ""
                }


            </div>

        </>
    )
}


export const ManageDraftBlogCard = ({ blog }) => {

    let { title, des, blog_id, index } = blog
    index++;

    let { userAuth } = useContext(UserContext)

    return (
        <div className='flex gap-5 lg:gap-10 pb-6 border-b mn-6 border-grey'>




            <h1 className='blog-index  text-center pl-4 md:pl-6 flex-none'>{index < 10 ? "0" + index : index}</h1>

            <div>
                <h1>{title}</h1>
                <p className='line-clamp-2 font-gelasio '>{des.length ? des : "no description"}</p>

                <div className='flex gap-6 mt-3 '>
                    <Link className='py-4 pr-2 underline' to={`/editor/${blog_id}`}>Edit</Link>
                    <button onClick={(e) => deleteBlog(blog, userAuth , e.target)} className='pr-4 py-2 underline text-red'>Delete</button>

                </div>


            </div>




        </div>

    )





}



const deleteBlog = (blog, userAuth, target) => {

    let {index , blog_id  , setStateFunc} = blog
    target.setAttribute('disabled' , true)

    axios.post(import.meta.env.VITE_SERVER_DOMAIN + '/delete-blog', {blog_id} , {
        headers:{
            Authorization: `Berear ${userAuth && userAuth.access_token}`
        }
    })
    .then(({data})=>{
        target.removeAttribute('disabled');


        setStateFunc(preval => {
            let {deletedDocsCount , totalDocs, results} =preval;

            results.splice(index , 1);

            if(!deletedDocsCount){
                deletedDocsCount=0
            }

            if(!results.length && totalDocs -1 > 0 ){

                return null;

            }

            return {...preval , totalDocs: totalDocs -1 , deletedDocsCount: deletedDocsCount + 1}

        })

    })
    .catch(err=>{
        console.log(err.message);

    })

}
