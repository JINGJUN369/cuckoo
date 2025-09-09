import React from 'react';
import { Link } from 'react-router-dom';

/**
 * 공개 랜딩 페이지 - 누구나 접근 가능
 */
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 네비게이션 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">CUCKOO</div>
              <div className="ml-2 text-sm text-gray-600">프로젝트 관리 시스템</div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                로그인
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* 헤로 섹션 */}
          <div className="mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              CUCKOO
              <span className="text-blue-600"> 프로젝트 관리</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              한국 제조업을 위한 전문적인 프로젝트 관리 솔루션
            </p>
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              3단계 워크플로우를 통한 체계적인 제품 개발 프로세스 관리
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium shadow-lg hover:shadow-xl transition-all"
              >
                무료로 시작하기
              </Link>
              <Link
                to="/login"
                className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 rounded-lg text-lg font-medium border-2 border-blue-600 shadow-lg hover:shadow-xl transition-all"
              >
                기존 계정 로그인
              </Link>
            </div>
          </div>

          {/* 특징 섹션 */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">체계적인 관리</h3>
              <p className="text-gray-600">
                3단계 워크플로우로 기본정보, 생산준비, 서비스준비까지 체계적으로 관리
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">실시간 협업</h3>
              <p className="text-gray-600">
                팀원들과 실시간으로 의견을 공유하고 프로젝트 진행 상황을 추적
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">진행률 추적</h3>
              <p className="text-gray-600">
                각 단계별 완료율을 시각적으로 확인하고 프로젝트 현황을 한눈에 파악
              </p>
            </div>
          </div>

          {/* CTA 섹션 */}
          <div className="bg-white rounded-2xl p-12 shadow-xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              지금 바로 시작해보세요
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              CUCKOO 프로젝트 관리 시스템으로 더 효율적인 제품 개발을 경험하세요
            </p>
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium shadow-lg hover:shadow-xl transition-all inline-block"
            >
              무료 계정 만들기
            </Link>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-4">CUCKOO</div>
            <p className="text-gray-600">
              © 2024 CUCKOO Project Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;