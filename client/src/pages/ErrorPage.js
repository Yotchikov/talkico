import { useEffect } from 'react';

export const ErrorPage = (props) => {
  const { error } = props;

  useEffect(() => {
    console.log(error);
  }, []);

  return (
    <div className="d-flex align-items-end justify-content-center h-100 m-5">
      <div className="container jumbotron w-50">
        <h1>Ошибка! ☠</h1>
        <h5 className="mt-3">
          Кажется, вы наткнулись на ошибку. Возможно, страница, на которую вы
          пытались попасть, не существует, но скорее всего это случилось из-за
          наших кривых ручек.
        </h5>
        <hr />
        <h5 className="mt-3">
          Пожалуйста, обновите страницу или вернитесь на <a href="/">главную</a>
        </h5>
        <a
          className="text-secondary"
          data-bs-toggle="collapse"
          href="#errorCollapse"
          role="button"
          aria-expanded="false"
          aria-controls="errorCollapse"
        >
          <small>Подробнее об ошибке</small>
        </a>
        <div className="collapse" id="errorCollapse">
          <samp>{error.message}</samp>
        </div>
      </div>
    </div>
  );
};
