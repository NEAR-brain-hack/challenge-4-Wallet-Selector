import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment'

export default function Messages({ messages }) {
  return (
    <>
      <h2>Messages</h2>
      {messages.map((message, i) =>
        // TODO: format as cards, add timestamp
        <p key={i} className={message.premium ? 'is-premium' : ''}>
          <strong>{message.sender}</strong>:<br/>
          {message.text}<br/>
          {moment(message.signedDate / 1000000).format('MMMM Do YYYY, h:mm:ss a')}
        </p>
      )}
    </>
  );
}

Messages.propTypes = {
  messages: PropTypes.array
};
