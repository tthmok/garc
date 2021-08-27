import asyncio
import platform
import time

from toio_config import *
import toio_message

from bleak import BleakClient

CUBE_ID_BLUE = "F7:7C:30:71:FC:BA"
CUBE_ID_YELLOW = "E1:F2:90:2E:8A:91"

# tail a file forever
def follow(thefile):
    thefile.seek(0,2)
    while True:
        line = thefile.readline()
        if not line:
            time.sleep(0.1)
            continue
        yield line

def create_cmd_data_motor(self,cid,l,r):
        return "{0}:{1}:{2}".format(cid, MSG_ID_MOTOR, toio_message.write_data_motor(l,r))

async def battery(address, loop):
    async with BleakClient(address, loop=loop) as client:
        x = client.is_connected
        #logger.info("Connected: {0}".format(x))
        print("Connected: {0}".format(x))
        #Battery level reading
        battery = await client.read_gatt_char(BATTERY_UUID)
        print("battery: {0}".format(int(battery[0])))

async def led(address, loop):
    async with BleakClient(address, loop=loop) as client:
        x = client.is_connected       
        #LED lights red for 160ms
        write_value = bytearray(b'\x03\x10\x01\x01\xff\x00\x00')
        await client.write_gatt_char(LIGHT_UUID, write_value)
        #Ends after 3 seconds
        await asyncio.sleep(3.0)

async def spin(address, loop):
    async with BleakClient(address, loop=loop) as client:
        x = client.is_connected
        #Motor: 100 speeds in front of the left, 20 speeds in the back of the right
        write_value = bytearray(b'\x01\x01\x01\x64\x02\x02\x14')
        await client.write_gatt_char(MOTOR_UUID, write_value)
        #Ends after 3 seconds
        await asyncio.sleep(3.0)

#https://toio.github.io/toio-spec/docs/ble_motor#%E6%9B%B8%E3%81%8D%E8%BE%BC%E3%81%BF%E6%93%8D%E4%BD%9C
# Data position	type	Contents	example
# 0	UInt8	Type of control	0x01(Motor control)
# 1	UInt8	ID of the controlling motor	0x01(left)
# 2	UInt8	Motor rotation direction	0x01(forward)
# 3	UInt8	Motor speed reading	0x64(0 to 255)
# 4	UInt8	ID of the controlling motor	0x02(right)
# 5	UInt8	Motor rotation direction	0x02(back)
# 6	UInt8	Motor speed reading	
# 7	UInt8	Motor control time	0x0A(100 ms)
async def move(address, dir, speed, time, loop):
    async with BleakClient(address, loop=loop) as client:
        x = client.is_connected
        data_list = [MOTOR_CONTROL_TIMED, MOTOR_LEFT, dir, min(speed, 255), 
            MOTOR_RIGHT, dir, min(speed, 255), time]
        #write_value = bytearray(b'\x01\x01\x01\x64\x02\x02\x14')
        write_value = bytearray(bytes(data_list))
        await client.write_gatt_char(MOTOR_UUID, write_value)

if __name__ == "__main__":
    address = (
        # discovery.Set the device address of the toio Core Cube found by py here
        CUBE_ID_BLUE  #For Windows or Linux, specify a hexadecimal 6-byte device address.
    )
    
    f = open('command_log.txt')
    lines = follow(f)

    for command in lines:
        if command.startswith("!spin"):
            loop = asyncio.get_event_loop()
            loop.run_until_complete(spin(address, loop))
        elif command.startswith("!go"):
            loop = asyncio.get_event_loop()
            loop.run_until_complete(move(address, MOTOR_FORWARD, 25, 50, loop))        
        elif command.startswith("!back"):
            loop = asyncio.get_event_loop()
            loop.run_until_complete(move(address, MOTOR_BACK, 25, 50, loop))
