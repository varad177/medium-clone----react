import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../App";
import { filterpaginationData } from "../common/filter-pagination-data";
import axios from "axios";
import Loader from "../components/loader.component";
import AnimationWrapper from "../common/page-animation";
import NoDataMessage from "../components/nodata.component";
import NotificationCard from "../components/notification-card.component";
import LoadMoreDataBtn from "../components/load-more.component";

const Notifications = () => {
    let { userAuth  , userAuth :{new_notification_available}  , setUserAuth} = useContext(UserContext);
    const [filter, setFilter] = useState("all");

    const [notifications, setNotifications] = useState(null);

    let filters = ["all", "like", "comment"];

    useEffect(() => {

        if (userAuth.access_token) {
            fetchNotifications({ page: 1 })
        }

    }, [userAuth.access_token, filter ])

    const fetchNotifications = ({ page, deletedDocCount = 0 }) => {
        axios
            .post(
                import.meta.env.VITE_SERVER_DOMAIN + "/notifications",
                { page, filter, deletedDocCount },
                {
                    headers: {
                        Authorization: `Bearer ${userAuth && userAuth.access_token} `,
                    },
                }
            )
            .then(async ({ data }) => {
         

                if(new_notification_available){
                    setUserAuth({...userAuth , new_notification_available : false})

                }



                let formattedData = await filterpaginationData({
                    state: notifications,
                    data,
                    page,
                    countRoute: "/all-notification-count",
                    data_to_send: { filter },
                    user: userAuth.access_token,
                });

                setNotifications(formattedData);

            })
            .catch((err) => {
                console.log(err.message);
            });
    };

    const handleFilter = (e) => {
        let btn = e.target;

        setFilter(btn.innerHTML);
        setNotifications(null)
    };

    return (
        <div>
            <div>
                <h1 className="max-md:hidden ">Recent Notification</h1>

                <div className="my-8 flex gap-6 ">
                    {filters.map((item, index) => {
                        return (
                            <button
                                onClick={handleFilter}
                                className={
                                    "py-2 " + (filter == item ? " btn-dark " : " btn-light")
                                }
                                key={index}
                            >
                                {item}
                            </button>
                        );
                    })}
                </div>
            </div>

            {
                notifications === null ? <Loader /> : <>

                    {
                        notifications.results.length ?
                            notifications.results.map((noti, i) => {
                                return <AnimationWrapper transition={{ delay: i * 0.08 }} key={i}>

                                    <NotificationCard data={noti} index={i} notificationState={{notifications , setNotifications}} />



                                </AnimationWrapper>
                            })
                            :
                            <NoDataMessage message={"nothing available"} />
                    }

                    <LoadMoreDataBtn state={notifications} fetchDataFun={fetchNotifications} additionalParams={{
                        deletedDocCount: notifications.deletedDocCount
                    }} />
                </>
            }
        </div>
    );
};

export default Notifications;
