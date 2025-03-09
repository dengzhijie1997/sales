// Firebase配置和初始化
const firebaseConfig = {
  apiKey: "AIzaSyCV4zMfbBwY4jT_qiRLzIAa76dMMH7Ayng",
  authDomain: "coffeesalesdata.firebaseapp.com",
  projectId: "coffeesalesdata",
  storageBucket: "coffeesalesdata.firebasestorage.app",
  messagingSenderId: "678537310070",
  appId: "1:678537310070:web:9d455614e312cf9356d457",
  measurementId: "G-EQCE557XHD"
};

// 初始化Firebase (使用兼容版本)
firebase.initializeApp(firebaseConfig);
firebase.analytics();

// 初始化Firestore数据库
const db = firebase.firestore();
const salesCollection = db.collection('salesData');

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