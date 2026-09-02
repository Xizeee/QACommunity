import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { HomePage } from '../pages/Home';
import { LoginPage } from '../pages/Login';
import { RegisterPage } from '../pages/Register';
import { AskQuestionPage } from '../pages/AskQuestion';
import { EditQuestionPage } from '../pages/EditQuestion';
import { QuestionDetailPage } from '../pages/QuestionDetail';
import { MePage } from '../pages/Me';
import { MyQuestionsPage } from '../pages/MyQuestions';
import { MyAnswersPage } from '../pages/MyAnswers';
import { MyPointsPage } from '../pages/MyPoints';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'questions/ask', element: <AskQuestionPage /> },
      { path: 'questions/:id', element: <QuestionDetailPage /> },
      { path: 'questions/:id/edit', element: <EditQuestionPage /> },
      { path: 'me', element: <MePage /> },
      { path: 'me/questions', element: <MyQuestionsPage /> },
      { path: 'me/answers', element: <MyAnswersPage /> },
      { path: 'me/points', element: <MyPointsPage /> },
    ],
  },
]);
