import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppProvider } from './context/AppContext.tsx'
import { AppShell } from './components/layout/AppShell.tsx'
import { Assistant } from './pages/Assistant.tsx'
import { AddWebsite } from './pages/AddWebsite.tsx'
import { BrokenLinks } from './pages/BrokenLinks.tsx'
import { CheckoutPage } from './pages/Checkout.tsx'
import { Dashboard } from './pages/Dashboard.tsx'
import { Landing } from './pages/Landing.tsx'
import { FormsPage } from './pages/Forms.tsx'
import { ImportantPages } from './pages/ImportantPages.tsx'
import { IssueDetail } from './pages/IssueDetail.tsx'
import { Issues } from './pages/Issues.tsx'
import { Monitoring } from './pages/Monitoring.tsx'
import { Settings } from './pages/Settings.tsx'
import { Tutorial } from './pages/Tutorial.tsx'
import { UptimePage } from './pages/Uptime.tsx'
import { Websites } from './pages/Websites.tsx'
import { Link } from 'react-router-dom'

const routerBasename = import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<AppShell />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="websites" element={<Websites />} />
            <Route path="websites/new" element={<AddWebsite />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="monitoring/uptime" element={<UptimePage />} />
            <Route path="monitoring/links" element={<BrokenLinks />} />
            <Route path="monitoring/pages" element={<ImportantPages />} />
            <Route path="monitoring/forms" element={<FormsPage />} />
            <Route path="monitoring/checkout" element={<CheckoutPage />} />
            <Route path="issues" element={<Issues />} />
            <Route path="issues/:issueId" element={<IssueDetail />} />
            <Route path="issues/*" element={<IssueDetail />} />
            <Route path="assistant" element={<Assistant />} />
            <Route path="tutorial" element={<Tutorial />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Missing />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}

function Missing() {
  return (
    <div className="rounded-2xl border border-line bg-panel p-8 text-center">
      <h1 className="text-xl font-semibold">That page is not part of Web Wrench.</h1>
      <Link to="/dashboard" className="mt-4 inline-block text-sm text-cyan">Back to the dashboard</Link>
    </div>
  )
}
