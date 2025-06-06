import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Layout from './components/Layout/Layout';
import PresentationList from './components/PresentationList/PresentationList';
import Editor from './components/Editor/Editor';
import Presenter from './components/PresentationMode/Presenter';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<PresentationList />} />
            <Route path="presentation/:id" element={<Editor />} />
            <Route path="presentation/:id/present" element={<Presenter />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;