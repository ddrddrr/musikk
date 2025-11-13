// import { EventSource } from "eventsource";
// import Cookies from "js-cookie";
// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
//
// interface useEventProps {
//     eventUrl: string;
//     handleEvent: (event: MessageEvent) => void;
//     eventKey: string;
//     deps: any[];
//     isEnabled: boolean;
// }
//
// export function useEvent({ eventUrl, handleEvent, eventKey, deps, isEnabled }: useEventProps) {
//     const navigate = useNavigate();
//
//     // pain...
//     useEffect(() => {
//         if (!isEnabled) return;
//         let es: EventSource | null = null;
//
//         const createEventSource = async () => {
//             try {
//                 es = new EventSource(eventUrl, {
//                     fetch: (input, init) =>
//                         fetch(input, {
//                             ...init,
//                             headers: {
//                                 ...init?.headers,
//                                 Authorization: `Bearer ${token}`,
//                             },
//                         }),
//                 });
//                 // es.addEventListener(eventKey, handleEvent);
//                 es.addEventListener(eventKey, (evt) => {
//                     console.log(`[SSE] ${eventKey} event:`, evt.data);
//                     handleEvent(evt);
//                 });
//                 es.addEventListener("error", async (e: any) => {
//                     console.error(e);
//                 });
//             } catch (err) {
//                 console.log(err);
//             }
//         };
//
//         createEventSource();
//
//         return () => {
//             es?.close();
//         };
//     }, [eventUrl, navigate, ...deps, isEnabled]);
// }
