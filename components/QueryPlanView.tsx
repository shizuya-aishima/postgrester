import React, { useState } from 'react';
import { QueryPlanInfo } from './services/DatabaseService';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';

interface QueryPlanViewProps {
  planInfo: QueryPlanInfo | null;
}

// コスト指標の評価（低い方が良い）
const evaluateCost = (cost: number): 'good' | 'medium' | 'bad' => {
  if (cost < 100) return 'good';
  if (cost < 1000) return 'medium';
  return 'bad';
};

// 実行時間の評価（低い方が良い）
const evaluateTime = (time: number): 'good' | 'medium' | 'bad' => {
  if (time < 10) return 'good';
  if (time < 100) return 'medium';
  return 'bad';
};

// ヒット率の評価（高い方が良い）
const evaluateRatio = (ratio: number): 'good' | 'medium' | 'bad' => {
  if (ratio > 0.9) return 'good';
  if (ratio > 0.5) return 'medium';
  return 'bad';
};

// パフォーマンス評価からカラーコードを取得
const getColorForEvaluation = (evaluation: 'good' | 'medium' | 'bad'): string => {
  switch (evaluation) {
    case 'good': return '#4caf50';  // 緑
    case 'medium': return '#ff9800'; // オレンジ
    case 'bad': return '#f44336';   // 赤
    default: return '#757575';      // グレー
  }
};

const QueryPlanNode = ({ node, level = 0 }: { node: any; level?: number }) => {
  const [expanded, setExpanded] = useState(level < 2); // 最初の2レベルまでは展開表示
  
  const nodeType = node['Node Type'];
  const relation = node['Relation Name'] || '';
  const startupCost = node['Startup Cost'] || 0;
  const totalCost = node['Total Cost'] || 0;
  const planRows = node['Plan Rows'] || 0;
  const actualRows = node['Actual Rows'] || 0;
  const planWidth = node['Plan Width'] || 0;
  const actualStartupTime = node['Actual Startup Time'] || 0;
  const actualTotalTime = node['Actual Total Time'] || 0;
  const actualLoops = node['Actual Loops'] || 1;
  
  // パフォーマンス評価
  const costEvaluation = evaluateCost(totalCost);
  const timeEvaluation = evaluateTime(actualTotalTime);
  
  // 行数予測の正確性（計画行数と実際の行数の比率）
  const rowAccuracy = planRows > 0 ? Math.min(actualRows / planRows, planRows / actualRows) : 0;
  const rowAccuracyEvaluation = evaluateRatio(rowAccuracy);
  
  const backgroundColor = level % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'transparent';
  
  // サブプランの再帰的表示
  const childPlans = [];
  if (node['Plans']) {
    for (let i = 0; i < node['Plans'].length; i++) {
      childPlans.push(
        <QueryPlanNode 
          key={`${nodeType}-${i}`} 
          node={node['Plans'][i]} 
          level={level + 1} 
        />
      );
    }
  }
  
  return (
    <Accordion 
      expanded={expanded} 
      onChange={() => setExpanded(!expanded)}
      sx={{ 
        mb: 1, 
        backgroundColor,
        ml: level * 2,
        width: `calc(100% - ${level * 16}px)`,
        border: '1px solid rgba(0,0,0,0.1)',
      }}
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box display="flex" alignItems="center" width="100%">
          <Typography variant="subtitle1" fontWeight="bold" sx={{ flexGrow: 1 }}>
            {nodeType}
            {relation && ` on ${relation}`}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title={`総コスト: ${totalCost.toFixed(2)}`}>
              <Chip 
                label={`コスト: ${totalCost.toFixed(2)}`} 
                size="small"
                sx={{ 
                  bgcolor: getColorForEvaluation(costEvaluation),
                  color: 'white'
                }}
              />
            </Tooltip>
            
            <Tooltip title={`実行時間: ${actualTotalTime.toFixed(3)} ms`}>
              <Chip 
                label={`${actualTotalTime.toFixed(3)} ms`} 
                size="small"
                sx={{ 
                  bgcolor: getColorForEvaluation(timeEvaluation),
                  color: 'white'
                }}
              />
            </Tooltip>
            
            <Tooltip title={`行数: 計画=${planRows} / 実際=${actualRows}`}>
              <Chip 
                label={`${actualRows} 行`} 
                size="small"
                sx={{ 
                  bgcolor: getColorForEvaluation(rowAccuracyEvaluation),
                  color: 'white'
                }}
              />
            </Tooltip>
          </Box>
        </Box>
      </AccordionSummary>
      
      <AccordionDetails>
        <Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>項目</TableCell>
                  <TableCell>値</TableCell>
                  <TableCell>項目</TableCell>
                  <TableCell>値</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>ノードタイプ</TableCell>
                  <TableCell>{nodeType}</TableCell>
                  <TableCell>リレーション</TableCell>
                  <TableCell>{relation || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>開始コスト</TableCell>
                  <TableCell>{startupCost.toFixed(2)}</TableCell>
                  <TableCell>総コスト</TableCell>
                  <TableCell>{totalCost.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>計画行数</TableCell>
                  <TableCell>{planRows}</TableCell>
                  <TableCell>実際行数</TableCell>
                  <TableCell>{actualRows}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>開始時間</TableCell>
                  <TableCell>{actualStartupTime.toFixed(3)} ms</TableCell>
                  <TableCell>合計時間</TableCell>
                  <TableCell>{actualTotalTime.toFixed(3)} ms</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>行幅</TableCell>
                  <TableCell>{planWidth}</TableCell>
                  <TableCell>ループ回数</TableCell>
                  <TableCell>{actualLoops}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* フィルタ条件や出力列などの詳細情報 */}
          {node['Filter'] && (
            <Box mt={2}>
              <Typography variant="subtitle2">フィルタ条件:</Typography>
              <Paper variant="outlined" sx={{ p: 1, bgcolor: 'rgba(0,0,0,0.02)' }}>
                <Typography variant="body2" fontFamily="monospace">{node['Filter']}</Typography>
              </Paper>
            </Box>
          )}
          
          {node['Output'] && (
            <Box mt={2}>
              <Typography variant="subtitle2">出力列:</Typography>
              <Paper variant="outlined" sx={{ p: 1, bgcolor: 'rgba(0,0,0,0.02)' }}>
                <Typography variant="body2" fontFamily="monospace">
                  {Array.isArray(node['Output']) ? node['Output'].join(', ') : node['Output']}
                </Typography>
              </Paper>
            </Box>
          )}
          
          {/* I/O統計情報の表示 */}
          {(node['Shared Hit Blocks'] !== undefined || node['Shared Read Blocks'] !== undefined) && (
            <Box mt={2}>
              <Typography variant="subtitle2">I/O統計:</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableBody>
                    {node['Shared Hit Blocks'] !== undefined && (
                      <TableRow>
                        <TableCell>共有ヒットブロック</TableCell>
                        <TableCell>{node['Shared Hit Blocks']}</TableCell>
                      </TableRow>
                    )}
                    {node['Shared Read Blocks'] !== undefined && (
                      <TableRow>
                        <TableCell>共有読込ブロック</TableCell>
                        <TableCell>{node['Shared Read Blocks']}</TableCell>
                      </TableRow>
                    )}
                    {node['Shared Dirtied Blocks'] !== undefined && (
                      <TableRow>
                        <TableCell>共有ダーティブロック</TableCell>
                        <TableCell>{node['Shared Dirtied Blocks']}</TableCell>
                      </TableRow>
                    )}
                    {node['Shared Written Blocks'] !== undefined && (
                      <TableRow>
                        <TableCell>共有書込ブロック</TableCell>
                        <TableCell>{node['Shared Written Blocks']}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          
          {/* サブプランの表示 */}
          {childPlans.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2">サブプラン:</Typography>
              <Box mt={1}>
                {childPlans}
              </Box>
            </Box>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

const QueryPlanView: React.FC<QueryPlanViewProps> = ({ planInfo }) => {
  if (!planInfo) {
    return (
      <Box p={2}>
        <Typography>クエリプラン情報がありません。「プラン取得」ボタンをクリックしてクエリプランを取得してください。</Typography>
      </Box>
    );
  }
  
  const { planData, executionTime } = planInfo;
  
  // プランデータがJSON形式でない場合の処理
  if (!planData || !Array.isArray(planData)) {
    return (
      <Box p={2}>
        <Typography color="error">クエリプランデータの形式が正しくありません</Typography>
        <pre>{JSON.stringify(planData, null, 2)}</pre>
      </Box>
    );
  }
  
  // PostgreSQLのEXPLAIN JSON出力形式に基づいて処理
  const plan = planData[0];
  
  // 概要情報の表示
  return (
    <Box p={2}>
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>クエリプラン概要</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell><strong>プランニング時間</strong></TableCell>
                <TableCell>{plan['Planning Time'] ? `${plan['Planning Time'].toFixed(3)} ms` : '不明'}</TableCell>
                <TableCell><strong>実行時間</strong></TableCell>
                <TableCell>{plan['Execution Time'] ? `${plan['Execution Time'].toFixed(3)} ms` : '不明'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>クエリ実行時間（トータル）</strong></TableCell>
                <TableCell colSpan={3}>{executionTime.toFixed(3)} ms</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>実行プラン詳細</Typography>
        {plan['Plan'] ? (
          <QueryPlanNode node={plan['Plan']} />
        ) : (
          <Typography color="error">プラン情報が見つかりません</Typography>
        )}
      </Box>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>パフォーマンス評価</Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>診断結果</Typography>

          {plan['Execution Time'] && (
            <Box mt={2}>
              <Typography variant="subtitle2">実行時間: {plan['Execution Time'].toFixed(3)} ms</Typography>
              <Box display="flex" alignItems="center" mt={0.5}>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, (plan['Execution Time'] / 1000) * 100)} 
                  sx={{ 
                    flexGrow: 1, 
                    height: 10, 
                    bgcolor: 'background.paper',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: plan['Execution Time'] < 10 ? 'success.main' : 
                               plan['Execution Time'] < 100 ? 'warning.main' : 'error.main'
                    }
                  }}
                />
                <Typography variant="caption" sx={{ ml: 1, minWidth: 100 }}>
                  {plan['Execution Time'] < 10 ? '良好' : 
                   plan['Execution Time'] < 100 ? '許容範囲' : '最適化が必要'}
                </Typography>
              </Box>
            </Box>
          )}

          {/* クエリが低速な場合のアドバイス */}
          {plan['Execution Time'] && plan['Execution Time'] > 100 && (
            <Box mt={2} p={1.5} bgcolor="error.lighter" borderRadius={1}>
              <Typography variant="subtitle2" color="error.dark">パフォーマンス改善のヒント:</Typography>
              <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                <li>インデックスの追加を検討してください</li>
                <li>複雑なJOINの順序を最適化してください</li>
                <li>不要なカラムを取得しないようにしてください</li>
                <li>サブクエリの代わりにJOINを使用することを検討してください</li>
                <li>大量データを取得する場合はページネーションを検討してください</li>
              </ul>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default QueryPlanView; 