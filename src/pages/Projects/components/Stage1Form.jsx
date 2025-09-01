import React from 'react';
import { Input } from '../../../components/ui';

const Stage1Form = ({ project, onUpdate }) => {
  const stage1Data = project.stage1 || {};

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-6">
        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
        <h3 className="text-xl font-semibold text-blue-600">1차 단계 - 기본 정보</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. 제품군 */}
        <Input
          label="1. 제품군"
          value={stage1Data.productGroup || ''}
          onChange={(e) => onUpdate('stage1', 'productGroup', e.target.value)}
          placeholder="예: 정수기, 비데, 공기청정기"
        />
        
        {/* 2. 제조사 */}
        <Input
          label="2. 제조사"
          value={stage1Data.manufacturer || ''}
          onChange={(e) => onUpdate('stage1', 'manufacturer', e.target.value)}
          placeholder="예: 자사, 나누텍, 하이센스"
        />
        
        {/* 3. 벤더사 */}
        <Input
          label="3. 벤더사"
          value={stage1Data.vendor || ''}
          onChange={(e) => onUpdate('stage1', 'vendor', e.target.value)}
          placeholder="예: 신성전자, TKK"
        />
        
        {/* 4. 파생모델 */}
        <Input
          label="4. 파생모델"
          value={stage1Data.derivativeModel || ''}
          onChange={(e) => onUpdate('stage1', 'derivativeModel', e.target.value)}
          placeholder="예: 색상 등"
        />
        
        {/* 5. 출시 예정일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">5. 출시 예정일</label>
          <div className="flex items-center space-x-3">
            <Input
              type="date"
              value={stage1Data.launchDate || ''}
              onChange={(e) => onUpdate('stage1', 'launchDate', e.target.value)}
              className="flex-1"
            />
            <label className="flex items-center whitespace-nowrap">
              <input
                type="checkbox"
                checked={stage1Data.launchDateExecuted || false}
                onChange={(e) => onUpdate('stage1', 'launchDateExecuted', e.target.checked)}
                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">실행완료</span>
            </label>
          </div>
        </div>
        
        {/* 6. 상품개발담당자 */}
        <Input
          label="6. 상품개발담당자"
          value={stage1Data.productManager || ''}
          onChange={(e) => onUpdate('stage1', 'productManager', e.target.value)}
          placeholder="예: 홍길동 / 상품개발팀"
        />
        
        {/* 7. 연구소 담당자(기구) */}
        <Input
          label="7. 연구소 담당자(기구)"
          value={stage1Data.mechanicalEngineer || ''}
          onChange={(e) => onUpdate('stage1', 'mechanicalEngineer', e.target.value)}
          placeholder="예: 김기구 / 연구개발팀"
        />
        
        {/* 8. 연구소 담당자(회로) */}
        <Input
          label="8. 연구소 담당자(회로)"
          value={stage1Data.circuitEngineer || ''}
          onChange={(e) => onUpdate('stage1', 'circuitEngineer', e.target.value)}
          placeholder="예: 이회로 / 연구개발팀"
        />
        
        {/* 9. 양산 예정일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">9. 양산 예정일</label>
          <div className="flex items-center space-x-3">
            <Input
              type="date"
              value={stage1Data.massProductionDate || ''}
              onChange={(e) => onUpdate('stage1', 'massProductionDate', e.target.value)}
              className="flex-1"
            />
            <label className="flex items-center whitespace-nowrap">
              <input
                type="checkbox"
                checked={stage1Data.massProductionDateExecuted || false}
                onChange={(e) => onUpdate('stage1', 'massProductionDateExecuted', e.target.checked)}
                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
              value={stage1Data.notes || ''}
              onChange={(e) => onUpdate('stage1', 'notes', e.target.value)}
              rows={6}
              placeholder="이 영역은 모든 사용자가 공유하는 메모장입니다. 프로젝트 관련 중요 사항, 변경 내용, 특이사항 등을 자유롭게 작성해주세요..."
              className="w-full px-4 py-3 border-0 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm leading-relaxed"
            />
            <div className="mt-2 text-xs text-gray-500 flex items-center space-x-2">
              <span>💡</span>
              <span>팁: 날짜와 내용을 함께 기록하면 변경 이력 추적에 도움됩니다</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stage1Form;