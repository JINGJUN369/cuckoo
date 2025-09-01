# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server:**
```bash
npm start
# Runs on PORT=3003 by default (configured in startup)
# Alternative: npx cross-env PORT=3003 npm start
```

**Build and test:**
```bash
npm run build    # Production build
npm test         # Run Jest tests
npm run eject    # Eject from create-react-app (irreversible)
```

**No linting/formatting commands** - Uses default create-react-app ESLint configuration.

## Architecture Overview

This is a **Korean project management system** specifically designed for manufacturing product development workflows. It uses a **Notion-style design system** with clean, minimal UI.

### Core Architecture Patterns

**State Management:**
- **Global State**: React Context API with `useReducer` pattern
- **useProjectStore**: Manages projects, opinions, UI state, and completed projects
- **useAuth**: Authentication state with user management and activity logging
- **localStorage Persistence**: All data persists to browser storage (no backend)

**Routing (v1.1):**
- **View-based routing** via `ui.currentView` state (not React Router)
- Views: `'list'`, `'detail'`, `'edit'`, `'project-dashboard'`, `'calendar'`, `'completed'`
- Main router: `AppRouter.jsx` (v1.1) - 핵심 라우팅 시스템 완전 리팩토링
- State management: `useProjectStore_v1.1.js` - Context 렌더링 문제 해결

**Authentication System:**
- **Multi-role authentication**: Users, admins, approval workflow
- **Activity logging**: Comprehensive change tracking
- **Admin features**: User management, activity logs
- **localStorage-based**: No server authentication

### Data Structure

**Project Lifecycle:**
- **3-stage workflow**: Stage1 (기본정보), Stage2 (생산준비), Stage3 (양산준비)
- **Each stage has specific Korean business fields** for manufacturing
- **Progress calculation**: Based on completed fields per stage
- **Model-based IDs**: Project IDs generated from model names + timestamp

**Key Data Models:**
```javascript
// Project structure
{
  id: "ModelName_timestamp",
  name: "Project Name",
  modelName: "Product Model Code",
  stage1: { productGroup, manufacturer, vendor, ... },
  stage2: { pilotProduction, techTransfer, ... },
  stage3: { initialProduction, bomManager, ... }
}
```

**Opinion System:**
- **Threaded discussions**: Opinions with nested replies
- **Stage-specific**: Opinions can be tagged to specific stages
- **Status workflow**: open → reviewed → resolved

### UI System

**Design Philosophy:**
- **Notion-style**: Clean, minimal, white-based design
- **Korean language**: All UI text in Korean
- **Color coding**: Blue (Stage1), Green (Stage2), Purple (Stage3)
- **Responsive**: Mobile-first with Tailwind CSS

**Key Components (v1.1):**
- **ProjectCard**: Shows overall + stage-wise progress with mini progress bars
- **BrandHeader**: Global navigation with Cuckoo (쿠쿠) branding
- **Stage Forms (v1.1)**: Optimized forms with validation and dual mode (edit/view)
  - Stage1Form_v1.1.jsx: 기본정보 + 유효성 검사 + 실시간 진행률
  - Stage2Form_v1.1.jsx: 생산준비 + 순서 검증 + 진행률 추적
  - Stage3Form_v1.1.jsx: 양산준비 + 의존성 검사 + 완성도 계산
- **ProjectEdit_v1.1.jsx**: 편집 전용 페이지 (자동저장, 변경이력, 유효성검사)
- **ProjectDetail_v1.1.jsx**: 보기 전용 페이지 (읽기모드, 의견시스템, 요약정보)
- **Calendar View**: Timeline visualization of all project dates
- **Dashboard Views**: Multiple dashboard types (main, project-specific)

### File Structure Patterns

**Pages Structure:**
- `/pages/Projects/`: Main project management pages
- `/pages/Auth/`: Login, register, password reset
- `/pages/Admin/`: User management and activity logs
- `/components/ui/`: Reusable UI components
- `/hooks/`: Custom React hooks for state management

**Form Components:**
- **Stage1Form**, **Stage2Form**, **Stage3Form**: Stage-specific data entry
- **NewProjectModal**: Project creation with model name → ID generation
- **OpinionForm/OpinionList**: Discussion system

## Important Implementation Notes

**Korean Manufacturing Fields:**
- Stage1: 제품군, 제조사, 벤더사, 출시예정일, 양산예정일, etc.
- Stage2: 파일럿생산, 기술이전, 설치주체, 서비스주체, etc.
- Stage3: 최초양산, BOM구성, 단가등록, 부품입고, etc.

**Progress Calculation:**
- Each stage progress = (completed_fields / total_fields) * 100
- Overall progress = average of all 3 stages
- Uses `getProjectProgress()` and `getStageProgress()` utilities

**Date Handling:**
- **D-Day calculation**: Based on `massProductionDate` from Stage1
- **Calendar integration**: All date fields from all stages appear in calendar
- **Completion tracking**: Each date field has corresponding `*Executed` boolean

**Data Persistence:**
- **localStorage keys**: `projects`, `completedProjects`, `opinions`, `users`, `activityLogs`
- **Mock data**: Initial data loaded from `utils/mockData.js` if no saved data
- **Activity logging**: All changes tracked with user ID and timestamp

**View Navigation:**
- Use `setCurrentView(viewName)` from `useProjectStore`
- Use `setSelectedProject(project)` before navigating to detail views
- **No URL routing** - state-based view switching only

## Korean Language Context

This application is entirely in Korean and designed for Korean manufacturing workflows. All user-facing text, field labels, and business logic terminology follows Korean business practices. When adding new features, maintain Korean language consistency and manufacturing industry terminology.