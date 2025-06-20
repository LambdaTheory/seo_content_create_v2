import React from 'react';
import { ContentQualityAnalysis } from '@/types/ResultPreview.types';
import styles from './QualityAnalysis.module.css';

interface QualityAnalysisProps {
  analysis: ContentQualityAnalysis;
  className?: string;
}

export const QualityAnalysis: React.FC<QualityAnalysisProps> = ({
  analysis,
  className
}) => {
  // 获取评分颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 获取进度条颜色
  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // 渲染进度条
  const renderProgressBar = (value: number, max: number = 100, label: string) => (
    <div className={styles.progressItem}>
      <div className={styles.progressLabel}>
        <span>{label}</span>
        <span className={getScoreColor(value)}>{value}%</span>
      </div>
      <div className={styles.progressBar}>
        <div 
          className={`${styles.progressFill} ${getProgressColor(value)}`}
          style={{ width: `${Math.min(value, max)}%` }}
        />
      </div>
    </div>
  );

  // 渲染密度指示器
  const renderDensityIndicator = (density: number, target: number, isOptimal: boolean) => {
    const percentage = target > 0 ? (density / target) * 100 : 0;
    const colorClass = isOptimal ? 'bg-green-500' : 
                      Math.abs(density - target) < 0.5 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
      <div className={styles.densityIndicator}>
        <div className={styles.densityBar}>
          <div 
            className={`${styles.densityFill} ${colorClass}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <span className={`${styles.densityValue} ${isOptimal ? 'text-green-600' : 'text-gray-600'}`}>
          {density.toFixed(1)}%
        </span>
      </div>
    );
  };

  return (
    <div className={`${styles.qualityAnalysis} ${className || ''}`}>
      {/* 总体评分 */}
      <div className={styles.overallScore}>
        <div className={styles.scoreCircle}>
          <div className={`${styles.scoreNumber} ${getScoreColor(analysis.overallScore)}`}>
            {analysis.overallScore}
          </div>
          <div className={styles.scoreLabel}>Overall Score</div>
        </div>
      </div>

      {/* 字数统计 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Word Count Analysis</h3>
        <div className={styles.wordCountGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{analysis.wordCount.total}</div>
            <div className={styles.statLabel}>Total Words</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{analysis.wordCount.chinese}</div>
            <div className={styles.statLabel}>Chinese</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{analysis.wordCount.english}</div>
            <div className={styles.statLabel}>English</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {analysis.wordCount.target.min}-{analysis.wordCount.target.max}
            </div>
            <div className={styles.statLabel}>Target Range</div>
          </div>
        </div>
        
        <div className={styles.rangeIndicator}>
          <div className={`${styles.rangeStatus} ${
            analysis.wordCount.isWithinRange ? styles.rangeSuccess : styles.rangeWarning
          }`}>
            {analysis.wordCount.isWithinRange ? '✓ Within target range' : '⚠ Outside target range'}
          </div>
        </div>
      </div>

      {/* 关键词密度 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Keyword Density</h3>
        
        {/* 主关键词 */}
        <div className={styles.keywordItem}>
          <div className={styles.keywordHeader}>
            <span className={styles.keywordName}>
              Primary: {analysis.keywordDensity.primary.keyword}
            </span>
            <span className={styles.keywordTarget}>
              Target: {analysis.keywordDensity.primary.target}%
            </span>
          </div>
          {renderDensityIndicator(
            analysis.keywordDensity.primary.density,
            analysis.keywordDensity.primary.target,
            analysis.keywordDensity.primary.isOptimal
          )}
        </div>

        {/* 次要关键词 */}
        {analysis.keywordDensity.secondary.map((keyword, index) => (
          <div key={index} className={styles.keywordItem}>
            <div className={styles.keywordHeader}>
              <span className={styles.keywordName}>
                Secondary: {keyword.keyword}
              </span>
              <span className={styles.keywordTarget}>
                Target: {keyword.target}%
              </span>
            </div>
            {renderDensityIndicator(
              keyword.density,
              keyword.target,
              keyword.isOptimal
            )}
          </div>
        ))}
      </div>

      {/* 内容结构 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Content Structure</h3>
        <div className={styles.structureGrid}>
          <div className={`${styles.structureItem} ${
            analysis.structure.hasTitle ? styles.structureSuccess : styles.structureError
          }`}>
            <span className={styles.structureIcon}>
              {analysis.structure.hasTitle ? '✓' : '✗'}
            </span>
            <span className={styles.structureLabel}>Title</span>
          </div>
          
          <div className={`${styles.structureItem} ${
            analysis.structure.hasDescription ? styles.structureSuccess : styles.structureError
          }`}>
            <span className={styles.structureIcon}>
              {analysis.structure.hasDescription ? '✓' : '✗'}
            </span>
            <span className={styles.structureLabel}>Description</span>
          </div>
          
          <div className={`${styles.structureItem} ${
            analysis.structure.hasFeatures ? styles.structureSuccess : styles.structureError
          }`}>
            <span className={styles.structureIcon}>
              {analysis.structure.hasFeatures ? '✓' : '✗'}
            </span>
            <span className={styles.structureLabel}>Features</span>
          </div>
          
          <div className={`${styles.structureItem} ${
            analysis.structure.hasSystemRequirements ? styles.structureSuccess : styles.structureError
          }`}>
            <span className={styles.structureIcon}>
              {analysis.structure.hasSystemRequirements ? '✓' : '✗'}
            </span>
            <span className={styles.structureLabel}>System Requirements</span>
          </div>
        </div>
        
        {renderProgressBar(analysis.structure.completeness, 100, 'Completeness')}
      </div>

      {/* SEO 评分 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>SEO Analysis</h3>
        <div className={styles.seoGrid}>
          {renderProgressBar(analysis.seoScore.title, 100, 'Title')}
          {renderProgressBar(analysis.seoScore.description, 100, 'Description')}
          {renderProgressBar(analysis.seoScore.keywords, 100, 'Keywords')}
          {renderProgressBar(analysis.seoScore.structure, 100, 'Structure')}
        </div>
        <div className={styles.seoOverall}>
          <div className={`${styles.seoScore} ${getScoreColor(analysis.seoScore.overall)}`}>
            SEO Score: {analysis.seoScore.overall}%
          </div>
        </div>
      </div>

      {/* 可读性评分 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Readability Analysis</h3>
        <div className={styles.readabilityGrid}>
          <div className={styles.readabilityItem}>
            <div className={styles.readabilityValue}>
              {analysis.readability.sentenceLength.toFixed(1)}
            </div>
            <div className={styles.readabilityLabel}>Avg Sentence Length</div>
          </div>
          
          <div className={styles.readabilityItem}>
            <div className={styles.readabilityValue}>
              {analysis.readability.paragraphLength.toFixed(1)}
            </div>
            <div className={styles.readabilityLabel}>Avg Paragraph Length</div>
          </div>
          
          <div className={styles.readabilityItem}>
            <div className={styles.readabilityValue}>
              {analysis.readability.complexWords}
            </div>
            <div className={styles.readabilityLabel}>Complex Words</div>
          </div>
        </div>
        
        {renderProgressBar(analysis.readability.score, 100, 'Readability Score')}
      </div>
    </div>
  );
};

export default QualityAnalysis; 