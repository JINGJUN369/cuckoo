import React from 'react';
import { Input } from '../../../components/ui';

const Stage2Form = ({ project, onUpdate }) => {
  const stage2Data = project.stage2 || {};

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-6">
        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
        <h3 className="text-xl font-semibold text-green-600">2차 단계 - 생산 준비</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. 파일럿 생산 예정일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">1. 파일럿 생산 예정일</label>
          <div className="flex items-center space-x-3">
            <Input
              type="date"
              value={stage2Data.pilotProductionDate || ''}
              onChange={(e) => onUpdate('stage2', 'pilotProductionDate', e.target.value)}
              className="flex-1"
            />
            <label className="flex items-center whitespace-nowrap">
              <input
                type="checkbox"
                checked={stage2Data.pilotProductionDateExecuted || false}
                onChange={(e) => onUpdate('stage2', 'pilotProductionDateExecuted', e.target.checked)}
                className="mr-2 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-600">실행완료</span>
            </label>
          </div>
        </div>

        {/* 2. 고객만족팀 파일럿 수량 */}
        <Input
          label="2. 고객만족팀 파일럿 수량"
          type="number"
          value={stage2Data.pilotQuantity || ''}
          onChange={(e) => onUpdate('stage2', 'pilotQuantity', e.target.value)}
          placeholder="예: 1 ~ 20개"
          min="1"
          max="20"
        />

        {/* 3. 파일럿 수령 예정일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">3. 파일럿 수령 예정일</label>
          <div className="flex items-center space-x-3">
            <Input
              type="date"
              value={stage2Data.pilotReceiveDate || ''}
              onChange={(e) => onUpdate('stage2', 'pilotReceiveDate', e.target.value)}
              className="flex-1"
            />
            <label className="flex items-center whitespace-nowrap">
              <input
                type="checkbox"
                checked={stage2Data.pilotReceiveDateExecuted || false}
                onChange={(e) => onUpdate('stage2', 'pilotReceiveDateExecuted', e.target.checked)}
                className="mr-2 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-600">실행완료</span>
            </label>
          </div>
        </div>

        {/* 4. 기술이전 예정일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">4. 기술이전 예정일</label>
          <div className="flex items-center space-x-3">
            <Input
              type="date"
              value={stage2Data.techTransferDate || ''}
              onChange={(e) => onUpdate('stage2', 'techTransferDate', e.target.value)}
              className="flex-1"
            />
            <label className="flex items-center whitespace-nowrap">
              <input
                type="checkbox"
                checked={stage2Data.techTransferDateExecuted || false}
                onChange={(e) => onUpdate('stage2', 'techTransferDateExecuted', e.target.checked)}
                className="mr-2 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-600">실행완료</span>
            </label>
          </div>
        </div>

        {/* 5. 설치 주체 */}
        <Input
          label="5. 설치 주체"
          value={stage2Data.installationEntity || ''}
          onChange={(e) => onUpdate('stage2', 'installationEntity', e.target.value)}
          placeholder="예: 지점, 대형가전 대행사 등"
        />

        {/* 6. 서비스 주체 */}
        <Input
          label="6. 서비스 주체"
          value={stage2Data.serviceEntity || ''}
          onChange={(e) => onUpdate('stage2', 'serviceEntity', e.target.value)}
          placeholder="예: 지점, 외주업체 등"
        />

        {/* 7. 교육 예정일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">7. 교육 예정일</label>
          <div className="flex items-center space-x-3">
            <Input
              type="date"
              value={stage2Data.trainingDate || ''}
              onChange={(e) => onUpdate('stage2', 'trainingDate', e.target.value)}
              className="flex-1"
            />
            <label className="flex items-center whitespace-nowrap">
              <input
                type="checkbox"
                checked={stage2Data.trainingDateExecuted || false}
                onChange={(e) => onUpdate('stage2', 'trainingDateExecuted', e.target.checked)}
                className="mr-2 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-600">실행완료</span>
            </label>
          </div>
        </div>

        {/* 8. 사용설명서 업로드 예정일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">8. 사용설명서 업로드 예정일</label>
          <div className="flex items-center space-x-3">
            <Input
              type="date"
              value={stage2Data.manualUploadDate || ''}
              onChange={(e) => onUpdate('stage2', 'manualUploadDate', e.target.value)}
              className="flex-1"
            />
            <label className="flex items-center whitespace-nowrap">
              <input
                type="checkbox"
                checked={stage2Data.manualUploadDateExecuted || false}
                onChange={(e) => onUpdate('stage2', 'manualUploadDateExecuted', e.target.checked)}
                className="mr-2 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-600">실행완료</span>
            </label>
          </div>
        </div>

        {/* 9. 기술교본 업로드 예정일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">9. 기술교본 업로드 예정일</label>
          <div className="flex items-center space-x-3">
            <Input
              type="date"
              value={stage2Data.techGuideUploadDate || ''}
              onChange={(e) => onUpdate('stage2', 'techGuideUploadDate', e.target.value)}
              className="flex-1"
            />
            <label className="flex items-center whitespace-nowrap">
              <input
                type="checkbox"
                checked={stage2Data.techGuideUploadDateExecuted || false}
                onChange={(e) => onUpdate('stage2', 'techGuideUploadDateExecuted', e.target.checked)}
                className="mr-2 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-600">실행완료</span>
            </label>
          </div>
        </div>

        {/* 비고 영역 (전체 너비) */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">비고 (공용 메모)</label>
          <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
            <textarea
              value={stage2Data.notes || ''}
              onChange={(e) => onUpdate('stage2', 'notes', e.target.value)}
              rows={6}
              placeholder="2차 단계 관련 사항을 자유롭게 기록해주세요. 파일럿 생산 결과, 교육 내용, 기술이전 상황, 문제점 및 해결방안 등..."
              className="w-full px-4 py-3 border-0 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm leading-relaxed"
            />
            <div className="mt-2 text-xs text-gray-500 flex items-center space-x-2">
              <span>📝</span>
              <span>모든 팀원이 확인 가능한 공용 메모입니다</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stage2Form;