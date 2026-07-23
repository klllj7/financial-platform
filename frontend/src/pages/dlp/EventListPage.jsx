import { useEffect, useState} from "react";
import { getEvents } from "../../api/dlpApi";

function EventListPage() {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        getEvents().then((res) => {
            setEvents(res.data);
        });
    }, []);

    return (
        <div>
            <h1>위험 이벤트 관리</h1>
            <table>
                <thead>
                    <tr>
                        <th>event_id</th>
                        <th>내용</th>
                        <th>탐지유형</th>
                        <th>등급</th>
                        <th>발생시각</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((event) => (
                        <tr key={event.event_id}>
                            <td>{event.event_id}</td>
                            <td>{event.description}</td>
                            <td>{event.detection_type}</td>
                            <td>{event.grade}</td>
                            <td>{event.created_at}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default EventListPage;