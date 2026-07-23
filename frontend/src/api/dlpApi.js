import axios from "axios";

const dlpApiInstance = axios.create({
    baseURL: "/dlp-api",
    headers: {
        "Content-Type": "application/json"
    }
});

export const getEvents = () => {
    return dlpApiInstance.get("/events");
}

export default dlpApiInstance;