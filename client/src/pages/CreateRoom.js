import { withRouter } from 'react-router-dom';
import { useHttp } from '../hooks/http.hook';
// import { v4 as uuid } from 'uuid';

export const CreateRoom = withRouter((props) => {
  const { loading, error, clearError, request } = useHttp();

  const create = async () => {
    try {
      const data = await request('/api/room/create', 'POST');
      props.history.push(`/room/${data.link}`);
    } catch (e) {
      alert('Неизвестная ошибка при создании комнаты, попробуйте снова');
    }
  };

  return (
    <button className="btn btn-success m-3" onClick={create}>
      Создайте комнату
    </button>
  );
});
