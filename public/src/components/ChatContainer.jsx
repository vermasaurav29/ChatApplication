import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import Logout from "./Logout";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { sendMessageRoute, recieveMessageRoute, deleteMsgRoute, updateMsgRoute } from "../utils/APIRoutes";

export default function ChatContainer({ currentChat, socket }) {
  const [messages, setMessages] = useState([]);
  const [msgStatus, setMsgStatus] = useState("send");
  const [currentMsg, setCurrentMsg] = useState("");
  const scrollRef = useRef();
  const inputRef = useRef();
  const [arrivalMessage, setArrivalMessage] = useState(null);

  const getChat = async(data) =>{
    return await axios.post(recieveMessageRoute, {
      from: data._id,
      to: currentChat._id,
    });
  }

  useEffect(async () => {
    const data = JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );
    const response = await getChat(data);
    setMessages(response.data);
  }, [currentChat]);

  useEffect(() => {
    const getCurrentChat = async () => {
      if (currentChat) {
        await JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        )._id;
      }
    };
    getCurrentChat();
  }, [currentChat]);

  const handleSendMsg = async (msg) => {
    const data = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );
    socket.current.emit("send-msg", {
      to: currentChat._id,
      from: data._id,
      msg,
    });
    await axios.post(sendMessageRoute, {
      from: data._id,
      to: currentChat._id,
      message: msg,
    });

    const msgs = await getChat(data);
    setMessages(msgs.data);
  };


  const handleDeleteMsg = async (msgId) => {
    await axios.delete(deleteMsgRoute, {
      data: {msgId}
    });
    const msgs = [...messages];
    const updatedMsg = msgs.filter(msg=>msg.id !== msgId);
    setMessages(updatedMsg);
  };

  const handleUpdateMsg = async (message) => {
    await axios.put(updateMsgRoute, {id: currentMsg.id, text: message});
    const msgs = [...messages];
    const updatedmsg = msgs.map(msg => msg.id === currentMsg.id ? {id: currentMsg.id, fromSelf: currentMsg.fromSelf, message} : msg);
    setMessages(updatedmsg);
    setMsgStatus("send");
  };

  const focusInput = (message) => {
    setCurrentMsg(message);
    inputRef.current.value = message.message;
    setMsgStatus("update");
    inputRef.current.focus();
  }

  useEffect(() => {
    if (socket.current) {
      socket.current.on("msg-recieve", (msg) => {
        setArrivalMessage({ fromSelf: false, message: msg });
      });
    }
  }, []);

  useEffect(() => {
    arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            <img
              src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
              alt=""
            />
          </div>
          <div className="username">
            <h3>{currentChat.username}</h3>
          </div>
        </div>
        <Logout />
      </div>
      <div className="chat-messages">
        {messages.map((message) => {
          return (
            <div ref={scrollRef} key={uuidv4()}>
              <div
                className={`message ${
                  message.fromSelf ? "sended" : "received"
                }`}
              >
                <div className="content dropdown">
                    <p>{message.message}</p>
                    <div className={`content dropdown-content ${message.fromSelf ? "" : "hidden"}`}>
                       <p onClick={e=>focusInput(message)}>Edit</p>
                       <p onClick={e=>handleDeleteMsg(message.id)}>Delete</p>
                    </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <ChatInput handleSendMsg={handleSendMsg} msgStatus={msgStatus} handleUpdateMsg={handleUpdateMsg} inputRef={inputRef}/>
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 80% 10%;
  gap: 0.1rem;
  overflow: hidden;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-template-rows: 15% 70% 15%;
  }
  .content.dropdown-content{
    background-color: #0A0A13;
    padding: 15px;
    right: -16px;
  }
  .dropdown {
    position: relative;
    display: inline-block;
  }
  
  .hidden{
    display: none!important;
  }
  
  .dropdown-content {
    display: none;
    position: absolute;
    background-color: #f9f9f9;
    min-width: 160px;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    padding: 12px 16px;
    z-index: 1;
  }
  .dropdown:hover .dropdown-content {
    display: block;
  }
  .dropdown-content p:hover {background-color: #0A0A13}

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      .avatar {
        img {
          height: 3rem;
        }
      }
      .username {
        h3 {
          color: white;
        }
      }
    }
  }
  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .message {
      display: flex;
      align-items: center;
      .content {
        max-width: 40%;
        overflow-wrap: break-word;
        padding: 1rem;
        font-size: 1.1rem;
        border-radius: 1rem;
        color: #d1d1d1;
        @media screen and (min-width: 720px) and (max-width: 1080px) {
          max-width: 70%;
        }
      }
    }
    .sended {
      justify-content: flex-end;
      .content {
        background-color: #4f04ff21;
      }
    }
    .recieved {
      justify-content: flex-start;
      .content {
        background-color: #9900ff20;
      }
    }
  }
`;
