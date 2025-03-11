import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Chip from '@mui/material/Chip';
import ExpandMore from '@mui/icons-material/ExpandMore';
import DatabaseService, { ColumnInfo, IndexInfo, ForeignKeyInfo, ConstraintInfo } from './services/DatabaseService';

interface SchemaDetailsProps {
  connectionId: string;
  database: string;
  schema: string;
  table: string;
}

const SchemaDetails: React.FC<SchemaDetailsProps> = ({ connectionId, database, schema, table }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [indexes, setIndexes] = useState<IndexInfo[]>([]);
  const [foreignKeys, setForeignKeys] = useState<ForeignKeyInfo[]>([]);
  const [constraints, setConstraints] = useState<ConstraintInfo[]>([]);

  useEffect(() => {
    const loadSchemaDetails = async () => {
      if (!connectionId || !database || !schema || !table) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 並行してすべての詳細情報を取得
        const [columnsResult, indexesResult, foreignKeysResult, constraintsResult] = await Promise.all([
          DatabaseService.getTableColumns(connectionId, database, schema, table),
          DatabaseService.getTableIndexes(connectionId, database, schema, table),
          DatabaseService.getTableForeignKeys(connectionId, database, schema, table),
          DatabaseService.getTableConstraints(connectionId, database, schema, table)
        ]);

        if (columnsResult.success && columnsResult.columns) {
          setColumns(columnsResult.columns);
        } else if (columnsResult.error) {
          setError(`カラム情報の取得に失敗しました: ${columnsResult.error}`);
        }

        if (indexesResult.success && indexesResult.indexes) {
          setIndexes(indexesResult.indexes);
        } else if (indexesResult.error) {
          setError(`インデックス情報の取得に失敗しました: ${indexesResult.error}`);
        }

        if (foreignKeysResult.success && foreignKeysResult.foreignKeys) {
          setForeignKeys(foreignKeysResult.foreignKeys);
        } else if (foreignKeysResult.error) {
          setError(`外部キー情報の取得に失敗しました: ${foreignKeysResult.error}`);
        }

        if (constraintsResult.success && constraintsResult.constraints) {
          setConstraints(constraintsResult.constraints);
        } else if (constraintsResult.error) {
          setError(`制約情報の取得に失敗しました: ${constraintsResult.error}`);
        }
      } catch (err) {
        setError(`スキーマ詳細の読み込み中にエラーが発生しました: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    };

    loadSchemaDetails();
  }, [connectionId, database, schema, table]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return <Box p={2}>読み込み中...</Box>;
  }

  if (error) {
    return <Box p={2} color="error.main">{error}</Box>;
  }

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>
        {schema}.{table}
      </Typography>
      
      <Tabs value={tabValue} onChange={handleTabChange} aria-label="テーブル詳細タブ">
        <Tab label="カラム" id="tab-0" aria-controls="tabpanel-0" />
        <Tab label="インデックス" id="tab-1" aria-controls="tabpanel-1" />
        <Tab label="外部キー" id="tab-2" aria-controls="tabpanel-2" />
        <Tab label="制約" id="tab-3" aria-controls="tabpanel-3" />
      </Tabs>
      
      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>カラム名</TableCell>
                <TableCell>データ型</TableCell>
                <TableCell>NULL許可</TableCell>
                <TableCell>主キー</TableCell>
                <TableCell>デフォルト値</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {columns.length > 0 ? (
                columns.map((column, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{column.name}</TableCell>
                    <TableCell>{column.type}</TableCell>
                    <TableCell>{column.nullable ? '○' : '×'}</TableCell>
                    <TableCell>{column.isPrimary ? '○' : '×'}</TableCell>
                    <TableCell>{column.defaultValue || '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>カラム情報がありません</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {indexes.length > 0 ? (
          indexes.map((index, idx) => (
            <Accordion key={idx}>
              <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls={`index-content-${idx}`}
                id={`index-header-${idx}`}
              >
                <Typography>{index.name}</Typography>
                {index.isPrimary && <Chip label="主キー" color="primary" size="small" sx={{ ml: 1 }} />}
                {index.isUnique && !index.isPrimary && <Chip label="ユニーク" color="secondary" size="small" sx={{ ml: 1 }} />}
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="subtitle2">インデックスタイプ: {index.indexType}</Typography>
                <Typography variant="subtitle2">対象カラム:</Typography>
                <Box sx={{ pl: 2 }}>
                  {index.columns.map((column, colIdx) => (
                    <Chip key={colIdx} label={column} size="small" sx={{ m: 0.5 }} />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))
        ) : (
          <Typography>インデックス情報がありません</Typography>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        {foreignKeys.length > 0 ? (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>制約名</TableCell>
                  <TableCell>カラム</TableCell>
                  <TableCell>参照先</TableCell>
                  <TableCell>更新時</TableCell>
                  <TableCell>削除時</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {foreignKeys.map((fk, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{fk.constraintName}</TableCell>
                    <TableCell>{fk.columnName}</TableCell>
                    <TableCell>{`${fk.referencedSchema}.${fk.referencedTable}.${fk.referencedColumn}`}</TableCell>
                    <TableCell>{fk.updateRule}</TableCell>
                    <TableCell>{fk.deleteRule}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>外部キー情報がありません</Typography>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        {constraints.length > 0 ? (
          constraints.map((constraint, idx) => (
            <Accordion key={idx}>
              <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls={`constraint-content-${idx}`}
                id={`constraint-header-${idx}`}
              >
                <Typography>{constraint.name}</Typography>
                <Chip label={constraint.type} size="small" sx={{ ml: 1 }} />
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {constraint.definition}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))
        ) : (
          <Typography>制約情報がありません</Typography>
        )}
      </TabPanel>
    </Box>
  );
};

interface TabPanelProps {
  children: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
    >
      {value === index && <Box p={2}>{children}</Box>}
    </div>
  );
};

export default SchemaDetails; 