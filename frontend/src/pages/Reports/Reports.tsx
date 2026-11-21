import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { ReportsNavigation } from '../../components/Reports/ReportsNavigation'
import { ReportsOverview } from '../../components/Reports/ReportsOverview'

export const ReportsLayout = ({ children, header }: { children: ReactNode; header?: ReactNode }) => {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <div className="min-w-0 flex-1 flex flex-col bg-gray-50">
      {header}
      <div className="flex flex-col lg:flex-row">
        <ReportsNavigation projectId={projectId || ''} />
        <div className="min-w-0 flex-1 p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export const Reports = () => {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <ReportsLayout header={
      <div className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-600 mt-1">
          Track project progress with comprehensive analytics and reports
        </p>
      </div>
    }>
      <ReportsOverview projectId={parseInt(projectId || '0')} />
    </ReportsLayout>
  )
}
