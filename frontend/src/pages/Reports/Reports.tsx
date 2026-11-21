import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { ReportsOverview } from '../../components/Reports/ReportsOverview'

export const ReportsLayout = ({ children, header }: { children: ReactNode; header?: ReactNode }) => {
  return (
    <div className="min-w-0 flex-1 bg-gray-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
        {header}
        {children}
      </div>
    </div>
  )
}

export const Reports = () => {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <ReportsLayout header={
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">Pick a report to see how the work is going.</p>
      </div>
    }>
      <ReportsOverview projectId={parseInt(projectId || '0')} />
    </ReportsLayout>
  )
}
