import { withRouter } from 'react-router-dom';
import { useHttp } from '../hooks/http.hook';

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
    <>
      <div
        className="position-absolute"
        style={{ zIndex: '0', top: '16rem', left: '3rem' }}
      >
        <img
          src="/question.png"
          style={{
            width: '330px',
            height: '440px',
            zIndex: '0',
            transform: 'rotate(45deg)',
          }}
        ></img>
      </div>
      <div
        className="d-flex align-items-end justify-content-center h-100 m-5"
        style={{ zIndex: '10' }}
      >
        <div className="container jumbotron w-50">
          <h1>Добро пожаловать на сайт игровых видеоконференций!</h1>
          <p>
            На данном сайте вы можете играть со своими друзьями в
            онлайн-викторину с дополненной реальностью — вам необходимо вовремя
            отвечать на вопросы, которые будут появляться у вас над головой,
            наклоняя голову в ту сторону, где находится правильный, по вашему
            мнению, ответ.
          </p>
          <hr />
          <button className="btn btn-primary" onClick={create}>
            Создать комнату
          </button>
        </div>
      </div>
    </>
  );
});
