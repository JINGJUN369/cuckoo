import React from 'react';
import { Input } from '../../../components/ui';

const Stage3Form = ({ project, onUpdate }) => {
  const stage3Data = project.stage3 || {};

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-6">
        <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
        <h3 className="text-xl font-semibold text-purple-600">3차 단계 - 양산 준비</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. 최초양산 예정일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">1. 최초양산 예정일</label>
          <div className="flex items-center space-x-3">
            <Input
              type="date"
              value={stage3Data.initialProductionDate || ''}
              onChange={(e) => onUpdate('stage3', 'initialProductionDate', e.target.value)}
              className="flex-1"
            />
            <label className="flex items-center whitespace-nowrap">
              <input
                type="checkbox"
                checked={stage3Data.initialProductionDateExecuted || false}
                onChange={(e) => onUpdate('stage3', 'initialProductionDateExecuted', e.target.checked)}
                className="mr-2 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-600">실행완료</span>
            </label>
          </div>
        </div>

        {/* 2. 1차 부품 발주 예정일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">2. 1차 부품 발주 예정일</label>
          <div className="flex items-center space-x-3">
            <Input
              type="date"
              value={stage3Data.firstOrderDate || ''}
              onChange={(e) => onUpdate('stage3', 'firstOrderDate', e.target.value)}
              className="flex-1"
            />
            <label className="flex items-center whitespace-nowrap">
              <input
                type="checkbox"
                checked={stage3Data.firstOrderDateExecuted || false}
                onChange={(e) => onUpdate('stage3', 'firstOrderDateExecuted', e.target.checked)}
                className="mr-2 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-600">실행완료</span>
            </label>
          </div>
        </div>

        {/* 3. BOM 구성 담당자 */}
        <Input
          label="3. BOM 구성 담당자"
          value={stage3Data.bomManager || ''}
          onChange={(e) => onUpdate('stage3', 'bomManager', e.target.value)}
          placeholder="예: 연구 4팀 홍길동"
        />

        {/* 4. BOM 구성 목표 예정일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">4. BOM 구성 목표 예정일</label>
          <div className="flex items-center space-x-3">
            <Input
              type="date"
              value={stage3Data.bomTargetDate || ''}
              onChange={(e) => onUpdate('stage3', 'bomTargetDate', e.target.value)}
              className="flex-1"
            />
            <label className="flex items-center whitespace-nowrap">
              <input
                type="checkbox"
                checked={stage3Data.bomTargetDateExecuted || false}
                onChange={(e) => onUpdate('stage3', 'bomTargetDateExecuted', e.target.checked)}
                className="mr-2 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-600">실행완료</span>
            </label>
          </div>
        </div>

        {/* 5. 단가등록 담당자 */}
        <Input
          label="5. 단가등록 담당자"
          value={stage3Data.priceManager || ''}
          onChange={(e) => onUpdate('stage3', 'priceManager', e.target.value)}
          placeholder="예: 구매팀 김단가"
        />

        {/* 6. 단가등록 목표 예정일자 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">6. 단가등록 목표 예정일자</label>
          <div className="flex items-center space-x-3">
            <Input
              type="date"
              value={stage3Data.priceTargetDate || ''}
              onChange={(e) => onUpdate('stage3', 'priceTargetDate', e.target.value)}
              className="flex-1"
            />
            <label className="flex items-center whitespace-nowrap">
              <input
                type="checkbox"
                checked={stage3Data.priceTargetDateExecuted || false}
                onChange={(e) => onUpdate('stage3', 'priceTargetDateExecuted', e.target.checked)}
                className="mr-2 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-600">실행완료</span>
            </label>
          </div>
        </div>

        {/* 7. 부품 입고 예정일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">7. 부품 입고 예정일</label>
          <div className="flex items-center space-x-3">
            <Input
              type="date"
              value={stage3Data.partsDeliveryDate || ''}
              onChange={(e) => onUpdate('stage3', 'partsDeliveryDate', e.target.value)}
              className="flex-1"
            />
            <label className="flex items-center whitespace-nowrap">
              <input
                type="checkbox"
                checked={stage3Data.partsDeliveryDateExecuted || false}
                onChange={(e) => onUpdate('stage3', 'partsDeliveryDateExecuted', e.target.checked)}
                className="mr-2 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-600">실행완료</span>
            </label>
          </div>
        </div>

        {/* 빈 공간 채우기 */}
        <div></div>

        {/* 비고 영역 (전체 너비) */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">비고 (공용 메모)</label>
          <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
            <textarea
              value={stage3Data.notes || ''}
              onChange={(e) => onUpdate('stage3', 'notes', e.target.value)}
              rows={6}
              placeholder="3차 단계 관련 사항을 자유롭게 기록해주세요. 양산 준비 현황, BOM 구성 상태, 단가 협상 내용, 부품 조달 상황, 품질 이슈 등..."
              className="w-full px-4 py-3 border-0 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm leading-relaxed"
            />
            <div className="mt-2 text-xs text-gray-500 flex items-center space-x-2">
              <span>🔧</span>
              <span>양산 관련 중요 정보와 진행 상황을 공유해주세요</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stage3Form;