import { withRouter } from 'react-router-dom';
import { v4 as uuid } from 'uuid';

export const CreateRoom = withRouter((props) => {
  const create = () => {
    const roomId = uuid();
    props.history.push(`/room/${roomId}`);
  };

  return <button className="btn btn-success m-3" onClick={create}>Создайте комнату</button>;
});
