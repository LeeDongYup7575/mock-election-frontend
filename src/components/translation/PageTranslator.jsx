// PageTranslator.jsx - 모바일 아이콘 기능 추가

import React, { useState, useEffect } from 'react';
import { TranslateAPI } from '../../api/TranslationApi';
import './PageTranslator.css';

function PageTranslator({ inHeader = false }) {
    const [isTranslated, setIsTranslated] = useState(false);
    const [targetLanguage, setTargetLanguage] = useState('en'); // 기본값: 영어
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [translateProgress, setTranslateProgress] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false); // 모바일에서 확장 상태 관리

    // 원본 콘텐츠를 저장할 맵 - key: 요소 ID 또는 생성한 ID, value: 원본 텍스트
    const [originalContents, setOriginalContents] = useState({});

    // 언어 선택 변경 시 로컬 스토리지에 저장
    useEffect(() => {
        // 로컬 스토리지에서 언어 설정 복원
        const savedLanguage = localStorage.getItem('preferredLanguage');
        if (savedLanguage) {
            setTargetLanguage(savedLanguage);
        }
    }, []);

    // 컴포넌트 외부 클릭 감지를 위한 이벤트 리스너
    useEffect(() => {
        const handleClickOutside = (event) => {
            // 컴포넌트의 DOM 요소 가져오기
            const translatorElement = document.querySelector('.page-translator:not(.header-translator)');

            // 요소가 존재하고, 확장된 상태이며, 클릭이 컴포넌트 외부에서 발생한 경우
            if (
                translatorElement &&
                isExpanded &&
                !translatorElement.contains(event.target)
            ) {
                setIsExpanded(false);
            }
        };

        // 이벤트 리스너 추가
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        // 클린업 함수
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isExpanded]);

    // 언어 변경 핸들러
    const handleLanguageChange = (e) => {
        const newLanguage = e.target.value;
        setTargetLanguage(newLanguage);
        localStorage.setItem('preferredLanguage', newLanguage);

        // 이미 번역된 상태라면 새 언어로 다시 번역
        if (isTranslated) {
            restoreOriginalContent();
            setTimeout(() => translatePage(newLanguage), 100);
        }
    };

    // 요소가 Header 내부에 있는지 확인하는 함수
    const isElementInHeader = (element) => {
        let currentElement = element;

        // 부모 요소를 따라 올라가며 header 요소 확인
        while (currentElement) {
            if (
                currentElement.tagName === 'HEADER' ||
                currentElement.classList.contains('app-header') ||
                currentElement.classList.contains('header') ||
                currentElement.classList.contains('HeaderContainer') ||
                currentElement.id === 'header' ||
                currentElement.id === 'app-header'
            ) {
                return true;
            }
            currentElement = currentElement.parentElement;
        }
        return false;
    };

    // 아이콘 클릭 핸들러 (모바일용)
    const handleIconClick = () => {
        setIsExpanded(!isExpanded);
    };

    // 페이지 번역 함수
    const translatePage = async (lang = targetLanguage) => {
        // 한국어는 원문이므로 번역하지 않고 원본으로 복원
        if (lang === 'ko') {
            restoreOriginalContent();
            return;
        }

        // 이미 번역된 상태라면 원본으로 복원
        if (isTranslated) {
            restoreOriginalContent();
            return;
        }

        setIsLoading(true);
        setError(null);
        setTranslateProgress(0);

        try {
            // 전역적으로 번역 가능한 태그 선택
            // 일반적인 텍스트 컨테이너 요소들 선택
            const selector = `
                p, h1, h2, h3, h4, h5, h6, 
                span:not(.material-icons):not(.icon), 
                button:not([aria-label]), 
                a:not([aria-label]), 
                label, 
                li, 
                td, 
                th, 
                div[class*="title"], 
                div[class*="text"], 
                div[class*="label"],
                div[class*="message"],
                div[class*="description"],
                .option-text,
                .quiz-question,
                .quiz-title,
                .explanation-text,
                .answer-title
            `;

            const elements = document.querySelectorAll(selector);
            console.log('잠재적 번역 대상 요소 수:', elements.length);

            // 원본 콘텐츠 저장
            const originals = {};

            // 번역할 텍스트와 해당 요소의 ID 매핑 준비
            const textsToTranslate = [];
            const elementMap = [];

            let validElementCount = 0;

            elements.forEach((el, index) => {
                // Header 내부 요소인지 확인하고 제외
                if (isElementInHeader(el)) {
                    return;
                }

                // 번역 제외 속성 확인
                if (el.hasAttribute('data-no-translate')) {
                    return;
                }

                // PageTranslator 컴포넌트 자체는 번역에서 제외
                if (el.closest('.page-translator')) {
                    return;
                }

                // 보이지 않는 요소 스킵
                if (el.offsetParent === null && !el.classList.contains('active')) {
                    return;
                }

                // 빈 요소 스킵
                const text = el.innerText || el.textContent;
                if (!text || !text.trim() || text.length < 2) {
                    return;
                }

                // 이미 영어나 숫자만 있는 경우 스킵 (선택적 기능)
                if (/^[a-zA-Z0-9\s.,!?:;()\-_'"]+$/.test(text) && lang === 'en') {
                    return;
                }

                // 요소에 고유 ID 부여
                const elementId = el.id || `translate-el-${index}`;
                if (!el.id) el.id = elementId;

                // 원본 텍스트 저장
                originals[elementId] = text;

                // 번역할 텍스트 추가
                textsToTranslate.push(text);
                elementMap.push(elementId);

                validElementCount++;
            });

            setOriginalContents(originals);

            // 번역할 텍스트가 없으면 종료
            if (validElementCount === 0) {
                console.log('번역할 텍스트를 찾을 수 없습니다.');
                setIsLoading(false);
                setError('번역할 텍스트를 찾을 수 없습니다. 페이지 내용을 확인해주세요.');
                return;
            }

            console.log(`${validElementCount}개의 텍스트 요소에 대해 번역을 시작합니다.`);

            // 큰 페이지의 경우 배치로 처리
            const BATCH_SIZE = 50; // 한 번에 처리할 텍스트 개수
            let translatedCount = 0;

            for (let i = 0; i < textsToTranslate.length; i += BATCH_SIZE) {
                const batch = textsToTranslate.slice(i, i + BATCH_SIZE);
                const batchMap = elementMap.slice(i, i + BATCH_SIZE);

                // 배치 번역 요청
                const translations = await TranslateAPI.translateTexts(batch, lang);

                // 번역 결과 적용
                translations.forEach((translation, index) => {
                    const elementId = batchMap[index];
                    const element = document.getElementById(elementId);
                    if (element) {
                        if (element.innerText !== undefined) {
                            element.innerText = translation.translatedText;
                        } else if (element.textContent !== undefined) {
                            element.textContent = translation.translatedText;
                        }
                    }
                });

                translatedCount += batch.length;
                const progressPercentage = Math.round((translatedCount / textsToTranslate.length) * 100);
                setTranslateProgress(progressPercentage);

                console.log(`번역 진행 중: ${translatedCount}/${textsToTranslate.length} 완료 (${progressPercentage}%)`);
            }

            setIsTranslated(true);
        } catch (err) {
            console.error('페이지 번역 오류:', err);
            setError('번역 중 오류가 발생했습니다: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsLoading(false);
            setTranslateProgress(100);
        }
    };

    // 원본 콘텐츠 복원
    const restoreOriginalContent = () => {
        Object.entries(originalContents).forEach(([elementId, originalText]) => {
            const element = document.getElementById(elementId);
            if (element) {
                if (element.innerText !== undefined) {
                    element.innerText = originalText;
                } else if (element.textContent !== undefined) {
                    element.textContent = originalText;
                }
            }
        });

        setIsTranslated(false);
        setOriginalContents({});
    };

    // 언어별 국기 아이콘 가져오기
    const getLanguageIcon = (code) => {
        const icons = {
            ko: '🇰🇷',
            en: '🇺🇸',
            ja: '🇯🇵',
            zh: '🇨🇳',
            es: '🇪🇸',
            fr: '🇫🇷',
            de: '🇩🇪',
            ru: '🇷🇺',
            vi: '🇻🇳',
            th: '🇹🇭',
        };
        return icons[code] || '🌐';
    };

    // 번역 상태에 따른 버튼 텍스트
    const getButtonText = () => {
        if (isLoading) return '번역 중...';
        if (isTranslated) return '원문 보기';
        return inHeader ? '번역' : '번역하기';
    };

    // 컴포넌트 클래스 계산
    const componentClass = `page-translator ${inHeader ? 'header-translator' : ''} ${isTranslated ? 'is-translated' : ''} ${isExpanded ? 'expanded' : ''}`;

    return (
        <div className={componentClass} data-no-translate="true">
            {/* 모바일용 아이콘 버튼 */}
            <button
                className="translator-icon-button"
                onClick={handleIconClick}
                aria-label="번역 옵션 표시"
            >
                {getLanguageIcon(targetLanguage)}
            </button>

            <div className="translator-controls">
                <div className="language-selector-wrapper">
                    <select
                        value={targetLanguage}
                        onChange={handleLanguageChange}
                        className="language-selector"
                        disabled={isLoading}
                    >
                        <option value="ko">🇰🇷 한국어</option>
                        <option value="en">🇺🇸 English</option>
                        <option value="ja">🇯🇵 日本語</option>
                        <option value="zh">🇨🇳 中文</option>
                        <option value="es">🇪🇸 Español</option>
                        <option value="fr">🇫🇷 Français</option>
                        <option value="de">🇩🇪 Deutsch</option>
                        <option value="ru">🇷🇺 Русский</option>
                        <option value="vi">🇻🇳 Tiếng Việt</option>
                        <option value="th">🇹🇭 ภาษาไทย</option>
                    </select>
                </div>

                <button
                    onClick={() => translatePage()}
                    disabled={isLoading}
                    className={`translate-button ${isTranslated ? 'active' : ''}`}
                    aria-label="번역하기"
                >
                    {getButtonText()}
                </button>
            </div>

            {error && <div className="translator-error">{error}</div>}

            {isLoading && (
                <div className="translation-progress">
                    <div className="progress-bar">
                        <div className="progress-filled" style={{width: `${translateProgress}%`}}></div>
                    </div>
                    <div className="progress-text">{translateProgress}% 완료</div>
                </div>
            )}
        </div>
    );
}

export default PageTranslator;