import { Route, Routes } from 'react-router-dom'
import { LoginPage } from '../features/auth/pages/login-page'
import { ProfilePage } from '../features/auth/pages/profile-page'
import { EquipmentSettingsPage } from '../features/equipment/pages/equipment-settings-page'
import { ExerciseDetailPage } from '../features/exercises/pages/exercise-detail-page'
import { HistoryPage } from '../features/history/pages/history-page'
import { HomePage } from '../features/home/pages/home-page'
import { RoutineFormPage } from '../features/routines/pages/routine-form-page'
import { RoutinesListPage } from '../features/routines/pages/routines-list-page'
import { WorkoutSessionPage } from '../features/workout-session/pages/workout-session-page'
import { WorkoutStartPage } from '../features/workout-session/pages/workout-start-page'
import { WorkoutSummaryPage } from '../features/workout-session/pages/workout-summary-page'
import { ProtectedRoute } from './protected-route'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/routines"
        element={
          <ProtectedRoute>
            <RoutinesListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/routines/new"
        element={
          <ProtectedRoute>
            <RoutineFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/routines/:id/edit"
        element={
          <ProtectedRoute>
            <RoutineFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workout/start"
        element={
          <ProtectedRoute>
            <WorkoutStartPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workout/:id"
        element={
          <ProtectedRoute>
            <WorkoutSessionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workout/:id/summary"
        element={
          <ProtectedRoute>
            <WorkoutSummaryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercises/:id"
        element={
          <ProtectedRoute>
            <ExerciseDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/equipment"
        element={
          <ProtectedRoute>
            <EquipmentSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
