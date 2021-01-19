import { v4 as uuid } from 'uuid';

export const CreateRoom = (props) => {
  const create = () => {
    const roomId = uuid();
    props.history.push(`/room/${roomId}`);
  };

  return <button onClick={create}>Создайте комнату</button>;
};
