// Firebase 配置和初始化
const firebaseConfig = {
  apiKey: "AIzaSyCV4zMfbBwY4jT_qiRLzIAa76dMMH7Ayng",
  authDomain: "coffeesalesdata.firebaseapp.com",
  projectId: "coffeesalesdata",
  storageBucket: "coffeesalesdata.firebasestorage.app",
  messagingSenderId: "678537310070",
  appId: "1:678537310070:web:9d455614e312cf9356d457",
  measurementId: "G-EQCE557XHD"
};

// 初始化 Firebase
try {
  // 检查 Firebase 是否已初始化
  if (!firebase.apps || !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase 初始化成功');
  } else {
    console.log('Firebase 已初始化');
  }

  // 初始化 Firestore 数据库
  const db = firebase.firestore();
  const salesCollection = db.collection('salesData');
  console.log('Firestore 数据库已连接');
  
  // 导出全局变量
  window.salesCollection = salesCollection;
  window.db = db;
} catch (error) {
  console.error('Firebase 初始化失败:', error);
  alert('无法连接到 Firebase，将使用本地存储。错误信息: ' + error.message);
}

// 测试 Firebase 连接状态
function testFirebaseConnection() {
  return new Promise((resolve, reject) => {
    try {
      if (!firebase.apps || !firebase.apps.length) {
        reject(new Error('Firebase 未初始化'));
        return;
      }

      const testDoc = firebase.firestore().collection('_test_').doc('connection');
      testDoc.set({ timestamp: new Date().toISOString() })
        .then(() => {
          console.log('Firebase 连接测试成功');
          testDoc.delete().catch(e => console.log('清理测试文档时出错:', e));
          resolve(true);
        })
        .catch(error => {
          console.error('Firebase 连接测试失败:', error);
          reject(error);
        });
    } catch (error) {
      console.error('测试 Firebase 连接时出错:', error);
      reject(error);
    }
  });
}

// 导出连接测试函数
window.testFirebaseConnection = testFirebaseConnection;

// 获取所有销售数据
async function fetchSalesData() {
  try {
    const snapshot = await salesCollection.orderBy('date').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('获取数据时发生错误:', error);
    return [];
  }
}

// 添加销售记录
async function addSalesRecord(record) {
  try {
    await salesCollection.add(record);
    return true;
  } catch (error) {
    console.error('添加数据时发生错误:', error);
    return false;
  }
}

// 更新销售记录
async function updateSalesRecord(id, updatedRecord) {
  try {
    await salesCollection.doc(id).update(updatedRecord);
    return true;
  } catch (error) {
    console.error('更新数据时发生错误:', error);
    return false;
  }
}

// 删除销售记录
async function deleteSalesRecord(id) {
  try {
    await salesCollection.doc(id).delete();
    return true;
  } catch (error) {
    console.error('删除数据时发生错误:', error);
    return false;
  }
}

// 设置实时数据监听
function setupRealtimeListener(callback) {
  return salesCollection.orderBy('date').onSnapshot(snapshot => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(data);
  });
} 