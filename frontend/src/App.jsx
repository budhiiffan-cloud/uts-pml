import { Navigate, Route, Routes } from 'react-router-dom'
import PublicLayout from './components/PublicLayout'
import RequireRole from './components/RequireRole'
import { homeFor, useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import ProductDetail from './pages/ProductDetail'
import Akun from './pages/panel/Akun'
import Kategori from './pages/panel/Kategori'
import PanelLayout from './pages/panel/PanelLayout'
import Produk from './pages/panel/Produk'
import Checkout from './pages/Checkout'
import BuyerOrders from './pages/BuyerOrders'
import BuyerOrderDetail from './pages/BuyerOrderDetail'
import Consultation from './pages/Consultation'
import Pesanan from './pages/panel/Pesanan'
import Konsultasi from './pages/panel/Konsultasi'

function PanelIndex() {
  const { user } = useAuth()
  return <Navigate to={homeFor(user)} replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/produk/:id" element={<ProductDetail />} />
        <Route path="/checkout/:id" element={<Checkout />} />
        <Route path="/pesanan" element={<BuyerOrders />} />
        <Route path="/pesanan/:code" element={<BuyerOrderDetail />} />
        <Route path="/konsultasi" element={<Consultation />} />
      </Route>

      <Route path="/login" element={<Login />} />

      <Route
        path="/panel"
        element={
          <RequireRole roles={['admin', 'pemilik']}>
            <PanelLayout />
          </RequireRole>
        }
      >
        <Route index element={<PanelIndex />} />
        <Route path="produk" element={<RequireRole roles={['admin']}><Produk /></RequireRole>} />
        <Route path="kategori" element={<RequireRole roles={['admin']}><Kategori /></RequireRole>} />
        <Route path="pesanan" element={<RequireRole roles={['admin']}><Pesanan /></RequireRole>} />
        <Route path="konsultasi" element={<RequireRole roles={['admin']}><Konsultasi /></RequireRole>} />
        <Route path="akun" element={<RequireRole roles={['pemilik']}><Akun /></RequireRole>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
