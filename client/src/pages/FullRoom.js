export const FullRoom = (props) => {
  const { roomId } = props;
  return (
    <div className="d-flex align-items-end justify-content-center h-100 m-5">
      <div className="container jumbotron w-50">
        <h1>Комната недоступна 😨</h1>
        <h5 className="mt-3">
          Кажется, комнаты <em>{roomId}</em> не существует или она уже
          заполнена.
        </h5>
        <hr />
        <h5 className="mt-3">
          Пожалуйста, обновите страницу или вернитесь на <a href="/">главную</a>
        </h5>
      </div>
    </div>
  );
};
