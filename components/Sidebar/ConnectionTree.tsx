import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import ExpandMore from '@mui/icons-material/ExpandMore';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Storage from '@mui/icons-material/Storage';
import DataObject from '@mui/icons-material/DataObject';
import TableView from '@mui/icons-material/TableView';
import ViewColumn from '@mui/icons-material/ViewColumn';
import Dns from '@mui/icons-material/Dns';

import { ConnectionConfig } from '../services/DatabaseService';
import DatabaseService from '../services/DatabaseService';

interface TreeNodeProps {
  label: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
  isExpanded?: boolean;
  onClick?: () => void;
  isActive?: boolean;
}

// ツリーノードコンポーネント
const TreeNode: React.FC<TreeNodeProps> = ({ 
  label, 
  icon, 
  children, 
  isExpanded = false, 
  onClick,
  isActive = false
}) => {
  const [expanded, setExpanded] = useState<boolean>(isExpanded);

  useEffect(() => {
    setExpanded(isExpanded);
  }, [isExpanded]);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleClick = () => {
    if (onClick) onClick();
  };

  return (
    <>
      <ListItem
        onClick={handleClick}
        sx={{
          bgcolor: isActive ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.04)',
          },
          cursor: 'pointer',
        }}
      >
        {children && (
          <IconButton size="small" onClick={handleExpandClick}>
            {expanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
          </IconButton>
        )}
        <ListItemIcon sx={{ minWidth: children ? 'auto' : 36 }}>
          {icon}
        </ListItemIcon>
        <ListItemText primary={label} />
      </ListItem>
      {children && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 2 }}>
            {children}
          </List>
        </Collapse>
      )}
    </>
  );
};

interface ConnectionTreeProps {
  connections?: ConnectionConfig[];
  onSelectConnection?: (id: string) => void;
  activeConnectionId?: string | null;
  onSelectTable?: (connectionId: string, database: string, schema: string, table: string) => void;
}

type DatabaseStructure = {
  name: string;
  schemas: {
    name: string;
    tables: {
      name: string;
      type: string;
    }[];
  }[];
};

// 接続ツリーコンポーネント
const ConnectionTree: React.FC<ConnectionTreeProps> = ({ 
  connections = [], 
  onSelectConnection,
  activeConnectionId,
  onSelectTable
}) => {
  const [expandedConnections, setExpandedConnections] = useState<string[]>([]);
  const [expandedDatabases, setExpandedDatabases] = useState<{[key: string]: string[]}>({});
  const [expandedSchemas, setExpandedSchemas] = useState<{[key: string]: {[key: string]: string[]}}>({}); 
  const [databaseStructure, setDatabaseStructure] = useState<{[key: string]: DatabaseStructure[]}>({});
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [selectedTable, setSelectedTable] = useState<{
    connectionId: string;
    database: string;
    schema: string;
    table: string;
  } | null>(null);

  // 接続をクリックしたとき
  const handleConnectionClick = (id: string) => {
    if (onSelectConnection) {
      onSelectConnection(id);
    }
    
    // 接続の展開状態をトグル
    if (expandedConnections.includes(id)) {
      setExpandedConnections(expandedConnections.filter(connId => connId !== id));
    } else {
      setExpandedConnections([...expandedConnections, id]);
      // まだデータベース情報を読み込んでいない場合は読み込む
      if (!databaseStructure[id]) {
        loadDatabases(id);
      }
    }
  };

  // データベースをクリックしたとき
  const handleDatabaseClick = (connectionId: string, database: string) => {
    const currentExpanded = {...expandedDatabases};
    const connDatabases = currentExpanded[connectionId] || [];
    
    if (connDatabases.includes(database)) {
      // 展開済みの場合は閉じる
      currentExpanded[connectionId] = connDatabases.filter(db => db !== database);
    } else {
      // 新たに展開する
      currentExpanded[connectionId] = [...connDatabases, database];
      // スキーマをロード
      loadSchemas(connectionId, database);
    }
    
    setExpandedDatabases(currentExpanded);
  };

  // スキーマをクリックしたとき
  const handleSchemaClick = (connectionId: string, database: string, schema: string) => {
    const currentExpanded = {...expandedSchemas};
    if (!currentExpanded[connectionId]) {
      currentExpanded[connectionId] = {};
    }
    if (!currentExpanded[connectionId][database]) {
      currentExpanded[connectionId][database] = [];
    }
    
    const dbSchemas = currentExpanded[connectionId][database];
    
    if (dbSchemas.includes(schema)) {
      // 展開済みの場合は閉じる
      currentExpanded[connectionId][database] = dbSchemas.filter(s => s !== schema);
    } else {
      // 新たに展開する
      currentExpanded[connectionId][database] = [...dbSchemas, schema];
      // テーブルをロード
      loadTables(connectionId, database, schema);
    }
    
    setExpandedSchemas(currentExpanded);
  };

  // テーブルをクリックしたとき
  const handleTableClick = (connectionId: string, database: string, schema: string, table: string) => {
    setSelectedTable({ connectionId, database, schema, table });
    if (onSelectTable) {
      onSelectTable(connectionId, database, schema, table);
    }
  };

  // データベース一覧の読み込み
  const loadDatabases = async (connectionId: string) => {
    try {
      setLoadingStates(prev => ({ ...prev, [connectionId]: true }));
      setErrors(prev => ({ ...prev, [connectionId]: '' }));
      
      const result = await DatabaseService.getDatabases(connectionId);
      
      if (result.success && result.databases) {
        // データベース構造を初期化
        const newStructure = { ...databaseStructure };
        newStructure[connectionId] = result.databases.map(db => ({
          name: db,
          schemas: []
        }));
        setDatabaseStructure(newStructure);
      } else if (result.error) {
        setErrors(prev => ({ ...prev, [connectionId]: `データベース一覧の取得に失敗しました: ${result.error}` }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, [connectionId]: `データベース一覧の読み込み中にエラーが発生しました: ${(error as Error).message}` }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  // スキーマ一覧の読み込み
  const loadSchemas = async (connectionId: string, database: string) => {
    const loadingKey = `${connectionId}:${database}`;
    try {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
      setErrors(prev => ({ ...prev, [loadingKey]: '' }));
      
      const result = await DatabaseService.getSchemas(connectionId, database);
      
      if (result.success && result.schemas) {
        // スキーマ情報を更新
        const newStructure = { ...databaseStructure };
        const dbIndex = newStructure[connectionId]?.findIndex(db => db.name === database);
        
        if (dbIndex !== undefined && dbIndex >= 0 && newStructure[connectionId]) {
          newStructure[connectionId][dbIndex].schemas = result.schemas.map(schema => ({
            name: schema,
            tables: []
          }));
          setDatabaseStructure(newStructure);
        }
      } else if (result.error) {
        setErrors(prev => ({ ...prev, [loadingKey]: `スキーマ一覧の取得に失敗しました: ${result.error}` }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, [loadingKey]: `スキーマ一覧の読み込み中にエラーが発生しました: ${(error as Error).message}` }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // テーブル一覧の読み込み
  const loadTables = async (connectionId: string, database: string, schema: string) => {
    const loadingKey = `${connectionId}:${database}:${schema}`;
    try {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
      setErrors(prev => ({ ...prev, [loadingKey]: '' }));
      
      const result = await DatabaseService.getTables(connectionId, database, schema);
      
      if (result.success && result.tables) {
        // テーブル情報を更新
        const newStructure = { ...databaseStructure };
        const dbIndex = newStructure[connectionId]?.findIndex(db => db.name === database);
        
        if (dbIndex !== undefined && dbIndex >= 0 && newStructure[connectionId]) {
          const schemaIndex = newStructure[connectionId][dbIndex].schemas.findIndex(s => s.name === schema);
          
          if (schemaIndex >= 0) {
            newStructure[connectionId][dbIndex].schemas[schemaIndex].tables = result.tables;
            setDatabaseStructure(newStructure);
          }
        }
      } else if (result.error) {
        setErrors(prev => ({ ...prev, [loadingKey]: `テーブル一覧の取得に失敗しました: ${result.error}` }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, [loadingKey]: `テーブル一覧の読み込み中にエラーが発生しました: ${(error as Error).message}` }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // 接続ノードの描画
  const renderConnectionNode = (connection: ConnectionConfig) => {
    const isExpanded = expandedConnections.includes(connection.id);
    const isActive = connection.id === activeConnectionId;
    const isLoading = loadingStates[connection.id];
    const error = errors[connection.id];
    
    return (
      <React.Fragment key={connection.id}>
        <TreeNode 
          label={connection.name} 
          icon={<Dns color={isActive ? "primary" : "inherit"} />}
          isExpanded={isExpanded}
          onClick={() => handleConnectionClick(connection.id)}
          isActive={isActive}
        >
          {isLoading ? (
            <ListItem>
              <CircularProgress size={20} />
              <ListItemText primary="読み込み中..." sx={{ ml: 1 }} />
            </ListItem>
          ) : error ? (
            <ListItem>
              <ListItemText primary={error} sx={{ color: 'error.main' }} />
            </ListItem>
          ) : databaseStructure[connection.id]?.length > 0 ? (
            databaseStructure[connection.id].map(db => renderDatabaseNode(connection.id, db))
          ) : (
            <ListItem>
              <ListItemText primary="データベースが見つかりません" />
            </ListItem>
          )}
        </TreeNode>
      </React.Fragment>
    );
  };

  // データベースノードの描画
  const renderDatabaseNode = (connectionId: string, database: DatabaseStructure) => {
    const isExpanded = expandedDatabases[connectionId]?.includes(database.name);
    const loadingKey = `${connectionId}:${database.name}`;
    const isLoading = loadingStates[loadingKey];
    const error = errors[loadingKey];
    
    return (
      <TreeNode 
        key={database.name}
        label={database.name} 
        icon={<Storage />}
        isExpanded={isExpanded}
        onClick={() => handleDatabaseClick(connectionId, database.name)}
      >
        {isLoading ? (
          <ListItem>
            <CircularProgress size={20} />
            <ListItemText primary="読み込み中..." sx={{ ml: 1 }} />
          </ListItem>
        ) : error ? (
          <ListItem>
            <ListItemText primary={error} sx={{ color: 'error.main' }} />
          </ListItem>
        ) : database.schemas.length > 0 ? (
          database.schemas.map(schema => renderSchemaNode(connectionId, database.name, schema))
        ) : (
          <ListItem>
            <ListItemText primary="スキーマが見つかりません" />
          </ListItem>
        )}
      </TreeNode>
    );
  };

  // スキーマノードの描画
  const renderSchemaNode = (connectionId: string, databaseName: string, schema: { name: string; tables: { name: string; type: string }[] }) => {
    const isExpanded = expandedSchemas[connectionId]?.[databaseName]?.includes(schema.name);
    const loadingKey = `${connectionId}:${databaseName}:${schema.name}`;
    const isLoading = loadingStates[loadingKey];
    const error = errors[loadingKey];
    
    return (
      <TreeNode 
        key={schema.name}
        label={schema.name} 
        icon={<DataObject />}
        isExpanded={isExpanded}
        onClick={() => handleSchemaClick(connectionId, databaseName, schema.name)}
      >
        {isLoading ? (
          <ListItem>
            <CircularProgress size={20} />
            <ListItemText primary="読み込み中..." sx={{ ml: 1 }} />
          </ListItem>
        ) : error ? (
          <ListItem>
            <ListItemText primary={error} sx={{ color: 'error.main' }} />
          </ListItem>
        ) : schema.tables.length > 0 ? (
          schema.tables.map(table => renderTableNode(connectionId, databaseName, schema.name, table))
        ) : (
          <ListItem>
            <ListItemText primary="テーブルが見つかりません" />
          </ListItem>
        )}
      </TreeNode>
    );
  };

  // テーブルノードの描画
  const renderTableNode = (connectionId: string, databaseName: string, schemaName: string, table: { name: string; type: string }) => {
    const isSelected = selectedTable?.connectionId === connectionId && 
                       selectedTable?.database === databaseName && 
                       selectedTable?.schema === schemaName && 
                       selectedTable?.table === table.name;
    
    const icon = table.type === 'table' ? <TableView /> : <ViewColumn />;
    
    return (
      <ListItem 
        key={table.name}
        onClick={() => handleTableClick(connectionId, databaseName, schemaName, table.name)}
        sx={{
          pl: 2,
          bgcolor: isSelected ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.04)',
          },
          cursor: 'pointer',
        }}
      >
        <ListItemIcon>
          {icon}
        </ListItemIcon>
        <ListItemText 
          primary={table.name} 
          secondary={table.type === 'table' ? 'テーブル' : 'ビュー'} 
        />
      </ListItem>
    );
  };
  
  return (
    <Box sx={{ width: '100%', overflowX: 'hidden' }}>
      <List component="nav" aria-label="database connections">
        {connections.length > 0 ? (
          connections.map(renderConnectionNode)
        ) : (
          <ListItem>
            <Typography variant="body2" color="textSecondary">
              接続が登録されていません
            </Typography>
          </ListItem>
        )}
      </List>
    </Box>
  );
};

export default ConnectionTree; 