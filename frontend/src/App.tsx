import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import UploadPage from '@/pages/UploadPage'
import ChatPage from '@/pages/ChatPage'
import ViewerPage from '@/pages/ViewerPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/viewer" element={<ViewerPage />} />
      </Routes>
    </Router>
  )
}

export default App
