import { useEffect, useState, useRef } from 'react'
import { View, Text, TouchableOpacity, FlatList, Image } from 'react-native'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen'
import { useNavigation } from '@react-navigation/native'
import { AlertDialog, Button, Modal } from 'native-base'
import { StatusBar } from 'react-native'
import ProductoInterface from '../interfaces/ProductoInterface'
import useInv from '../hooks/useInv'
import useLogin from '../hooks/useLogin'
import { fetchOneItem, fetchSendData } from '../utils/api'
import { getDate, getHour } from '../utils/helpers'
import ProductsCart from '../components/ProductsCart'
import Loader from '../components/Loader'
import Logos from '../components/Logos'
import LabelCustomer from '../components/LabelCustomer'
import BackScreen from '../components/BackScreen'

const Cart = () => {
  const [fullProductsCart, setFullProductsCart] = useState([])
  const [subtotal, setSubtotal] = useState(0)
  const [total, setTotal] = useState(0)
  
  const [loadingCart, setLoadingCart] = useState(true)
  const [alertClearCart, setAlertClearCart] = useState(false)
  const [alertProcessOrder, setAlertProcessOrder] = useState(false)
  const [alertSuccessOrder, setAlertSuccessOrder] = useState(false)

  const { themeColors: { typography, backgrund, processBtn, darkTurquoise, green, icon, primary }, myUser } = useLogin()
  const { productsCart, setProductsCart, setLoaders, loaders, order, setOrder } = useInv()
  const cancelRef = useRef(null)
  const navigation = useNavigation()
  const { image_url } = myUser

  const onCloseAlertProcessOrder = () => setAlertProcessOrder(false)
  const onCloseAlertClearCart = () => setAlertClearCart(false)

  // -----------------------------------------------
  // ACTIONS
  // -----------------------------------------------

  // Get full products cart
  useEffect(() => {
    const getFullProductsCart = async () => {

      if (productsCart?.length > 0) {
        let newFullProductsCart = []
    
        for (let i = 0; i < productsCart.length; i++) {
          const code = productsCart[i].codigo
          const ammount = productsCart[i].ammount
    
          // get product api
          const res = await fetchOneItem('searchC', code)
          newFullProductsCart.push({ ...res[0], ammount })
          
          // last item
          if (i === productsCart.length - 1) {
            setFullProductsCart(newFullProductsCart as any)
            setLoadingCart(false)
          }
        }

        // subtotal & total
        const subtotal = newFullProductsCart.reduce((accumulator, product) => accumulator + product.precio1 * product.ammount, 0)
        const subtotalFormated = subtotal.toLocaleString()
        setSubtotal(subtotalFormated)

        const total = newFullProductsCart.reduce((accumulator, product) => accumulator + product.precio1 * product.ammount, 0)
        const totalFormated = total.toLocaleString()
        setTotal(totalFormated)
      } else {
        setLoadingCart(false)
      }
    }

    getFullProductsCart()
  }, [productsCart])

  // Clear cart
  const clearCart = () => {
    setAlertClearCart(false)
    setProductsCart([])
  }
  
  // -----------------------------------------------
  // ORDER
  // -----------------------------------------------

  // Send order
  useEffect(() => {
    const sendOrder = async () => {
      try {
        if (order.productos.length !== 0) {
          await fetchSendData(order)

          setTimeout(() => {
            // clear cart
            setProductsCart([])
          }, 2000)

          setTimeout(() => {

            setLoaders({ ...loaders, loadingConfirmOrder: false }) // loader from alert*
          }, 3000)
        }
      } catch (error) {
        console.log(error)
      }
    }
    sendOrder()
  }, [order])
  
  // Process order
  const handleProcess = () => {
    setLoaders({ ...loaders, loadingConfirmOrder: true })

    // order
    setOrder({
      ...order,
      date: getDate(new Date()),
      hora: getHour(new Date()),
      cliente: (myUser.from === 'scli' ? {
        name: myUser?.nombre,
        code: myUser?.cliente
      } : {
        name: myUser.us_nombre,
        usuario: myUser.us_codigo,
        code: myUser?.customer?.cliente
      }),
      productos: fullProductsCart.map((product: ProductoInterface) => ({
        codigo: product.codigo,
        descrip: String(product.descrip),
        base1: Number(product.base1),
        precio1: Number(product.precio1),
        iva: Number(product.iva),
        cantidad: Number(product.cantidad)
      })),
      subtotal: String(subtotal),
      total: String(total),
    })
    
    // close process alert
    setTimeout(() => {
      setAlertProcessOrder(false)

      // show success alert
      setTimeout(() => {
        setAlertSuccessOrder(true)
      }, 500)
    }, 2500)
  }

  return (
    <>
      <View className='flex-1 px-3 pt-6' style={{ backgroundColor: backgrund }}>
        <StatusBar barStyle='dark-content' />

        <Logos image={image_url} />

        {/* content */}
        <View className='h-full px-3'>

          {/* back & trash */}
          <View className='flex flex-row items-center justify-between gap-2 mb-2'>
            <BackScreen title='Carrito de compras' />

            {productsCart.length !== 0 && (
              <View>
                <TouchableOpacity onPress={() => setAlertClearCart(true)}>
                  <Image style={{ width: wp(8), height: wp(8) }} resizeMode='cover'
                    source={require('../assets/trash-can.png')}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* customer */}
          {productsCart.length !== 0 && myUser?.customer?.nombre ? (
            <LabelCustomer
              name={myUser?.customer?.nombre}
            />
          ):null}

          {/* products */}
          {loadingCart ? (
            <View className='mt-10'>
              <Loader color={`${primary}`} />
            </View>
          ) : (
            <View className='mt-3'>
              {productsCart.length === 0 && !loadingCart ? (
                <View className='flex flex-col items-center justify-center' style={{ height: hp(65) }}>
                  <Text className='font-extrabold text-center mt-6' style={{ color: typography, fontSize: wp(6) }}>
                    No hay productos
                  </Text>

                  <Text style={{ color: typography, fontSize: wp(4) }} className='font-medium'>Continúa {''}
                    <Text style={{ color: darkTurquoise, fontSize: wp(4) }} className='font-medium'
                      onPress={() => navigation.navigate('Home')}
                    >
                      aquí
                    </Text>
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={fullProductsCart}
                  numColumns={1}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ 
                    paddingBottom: 300,
                    marginTop: 15 
                  }}
                  overScrollMode='never'
                  renderItem={({ item }: { item: any }) => {
                    return (
                      <ProductsCart key={item.id} product={item} />
                    )
                  }}
                />
              )}
            </View>
          )}
        </View>

      </View>

      {/* process order */}
      {!loadingCart && (
        <View className='flex flex-col justify-center h-32 w-[100%] bottom-0 absolute border-t-[0.5px] border-t-[#999999]'>
          <View className='flex flex-col justify-center h-full w-[92%]'
            style={{ backgroundColor: backgrund, borderTopColor: icon, marginLeft: 16 }}
          >
            {productsCart.length !== 0 && (
              <View className='px-2'>
                {/* subtotal & total */}
                <View className='flex flex-row justify-between'>
                  <Text style={{ fontSize: wp(4.5), color: typography }} className='font-semibold'>
                    Subtotal:
                  </Text>
                  <Text style={{ fontSize: wp(4.5), color: typography, }} className='font-semibold'>
                    Bs. {subtotal}
                  </Text>
                </View>

                <View className='flex flex-row justify-between'>
                  <Text style={{ fontSize: wp(5), color: typography }} className='mb-2 font-extrabold'>
                    Total:
                  </Text>
                  <Text style={{ fontSize: wp(5), color: darkTurquoise, }} className='font-extrabold mb-2'>
                    Bs. {total}
                  </Text>
                </View>
              </View>
            )}

            {/* btn process */}
            <View className='rounded-xl py-3' style={{ backgroundColor: `${productsCart.length === 0 ? processBtn : green}`}}>
              <TouchableOpacity onPress={() => setAlertProcessOrder(true)}
                disabled={productsCart.length === 0 ? true : false}
              >
                <Text className='text-center font-bold text-white' style={{ fontSize: wp(5) }}>
                  Procesar pedido {productsCart.length === 0 ? '' : `(${productsCart.length})`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* alert clear cart */}
      <AlertDialog leastDestructiveRef={cancelRef} isOpen={alertClearCart} onClose={onCloseAlertClearCart}>
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>¿Deseas continuar?</AlertDialog.Header>
          <AlertDialog.Body>
            Se eliminarán todos los productos de tu carrito.
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button variant='unstyled' colorScheme='coolGray' onPress={onCloseAlertClearCart} ref={cancelRef}>
                Cancelar
              </Button>
              <Button color={darkTurquoise} onPress={() => clearCart()}>
                Aceptar
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>

      {/* alert process order */}
      <AlertDialog leastDestructiveRef={cancelRef} isOpen={alertProcessOrder} onClose={onCloseAlertProcessOrder}>
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Confirmar pedido</AlertDialog.Header>

          <AlertDialog.Body>
            <Text className='font-normal'>
              ¿Estás seguro de procesar el pedido?
            </Text>
          </AlertDialog.Body>

          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button variant='unstyled' colorScheme='coolGray' onPress={onCloseAlertProcessOrder} ref={cancelRef}>
                Cancelar
              </Button>
              <Button color={darkTurquoise} onPress={handleProcess}>
                {loaders.loadingConfirmOrder ? (
                  <View className='flex flex-row justify-center items-center w-14'>
                    <Loader color='white' size={wp(4)} />
                  </View>
                ) : (
                  <Text className='font-normal text-white'>Confirmar</Text>
                )}
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>

      {/* alert success order */}
      <Modal isOpen={alertSuccessOrder} onClose={() => setAlertSuccessOrder(false)} animationPreset='fade'>
        <Modal.Content style={{ width: 360, height: 500, backgroundColor: primary, marginBottom: 0 }}>
          <View className='flex flex-1 flex-col items-center justify-between'>
            
            {/* logo */}
            <View className='mt-4'>
              {!myUser?.customer?.cliente ? (
                <Image style={{ width: wp(40), height: wp(20) }} resizeMode='contain'
                  source={require('../assets/logo-drocerca.png')}
                />
              ): (
                <Image style={{ width: wp(40), height: wp(20) }} resizeMode='contain'
                  source={require('../assets/certra-process.png')}
                />  
              )}
            </View>

            {/* message */}
            <View className='flex flex-col justify-center items-center'>
              <Image style={{ width: wp(35), height: wp(25) }} resizeMode='contain'
                source={require('../assets/cart-check.png')}
              />
              <Text className='w-52 pt-4 text-center text-white' style={{ fontSize: wp(6) }}>
                Su pedido ha sido procesado con éxito
              </Text>
            </View>

            {/* btn ok */}
            <View className='w-64 mb-8 mx-4'>
              <TouchableOpacity style={{ backgroundColor: green }} className='rounded-xl'
                onPress={() => setAlertSuccessOrder(false)} 
              >
                <Text className='p-3 text-center text-white' style={{ fontSize: wp(6) }}>Ok</Text>
              </TouchableOpacity>
            </View>
            
          </View>
        </Modal.Content>
      </Modal>
    </>
  )
}

export default Cart