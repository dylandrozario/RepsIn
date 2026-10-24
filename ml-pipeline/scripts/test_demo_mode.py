#!/usr/bin/env python3
"""
Test suite for demo_current_time.py
Validates that all demo scenarios work correctly
"""

import subprocess
import sys
from pathlib import Path

def run_demo_command(args):
    """Run demo command and return output"""
    cmd = ['python', 'demo_current_time.py'] + args
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent
    )
    return result.returncode, result.stdout, result.stderr

def test_current_time():
    """Test 1: Current time demo runs without errors"""
    print("Test 1: Current time demo... ", end='')
    returncode, stdout, stderr = run_demo_command([])
    
    if returncode != 0:
        print(f"❌ FAILED\n{stderr}")
        return False
    
    # Check for key sections
    required_sections = [
        'OVERALL GYM STATUS',
        'EQUIPMENT AVAILABILITY',
        'LOOKING AHEAD',
        'BEST TIMES TODAY',
        'Quick Summary'
    ]
    
    for section in required_sections:
        if section not in stdout:
            print(f"❌ FAILED - Missing section: {section}")
            return False
    
    print("✅ PASSED")
    return True

def test_peak_hour():
    """Test 2: Peak hour scenario (Monday 5pm)"""
    print("Test 2: Peak hour (Monday 5pm)... ", end='')
    returncode, stdout, stderr = run_demo_command(['--time', '17', '--day', 'monday'])
    
    if returncode != 0:
        print(f"❌ FAILED\n{stderr}")
        return False
    
    # Should show high congestion
    if 'HIGH 🔴' not in stdout:
        print("❌ FAILED - Expected HIGH congestion")
        return False
    
    if 'Monday, 5:00 PM' not in stdout:
        print("❌ FAILED - Wrong time display")
        return False
    
    print("✅ PASSED")
    return True

def test_sweet_spot():
    """Test 3: Sweet spot scenario (Saturday 9pm)"""
    print("Test 3: Sweet spot (Saturday 9pm)... ", end='')
    returncode, stdout, stderr = run_demo_command(['--time', '21', '--day', 'saturday'])
    
    if returncode != 0:
        print(f"❌ FAILED\n{stderr}")
        return False
    
    # Should show low congestion
    if 'LOW 🟢' not in stdout:
        print("❌ FAILED - Expected LOW congestion")
        return False
    
    if 'Saturday, 9:00 PM' not in stdout:
        print("❌ FAILED - Wrong time display")
        return False
    
    # Should show high availability
    if '8/8 equipment types likely available' not in stdout:
        print("❌ FAILED - Expected all equipment available")
        return False
    
    print("✅ PASSED")
    return True

def test_personalized_recommendations():
    """Test 4: Personalized recommendations appear"""
    print("Test 4: Personalized recommendations... ", end='')
    returncode, stdout, stderr = run_demo_command([])
    
    if returncode != 0:
        print(f"❌ FAILED\n{stderr}")
        return False
    
    # Should show both personas
    if 'Busy Professional' not in stdout:
        print("❌ FAILED - Missing Busy Professional persona")
        return False
    
    if 'Flexible Student' not in stdout:
        print("❌ FAILED - Missing Flexible Student persona")
        return False
    
    print("✅ PASSED")
    return True

def test_different_days():
    """Test 5: Different days work correctly"""
    print("Test 5: Different weekdays... ", end='')
    
    days = ['monday', 'wednesday', 'friday', 'sunday']
    
    for day in days:
        returncode, stdout, stderr = run_demo_command(['--time', '12', '--day', day])
        
        if returncode != 0:
            print(f"❌ FAILED for {day}\n{stderr}")
            return False
        
        if day.title() not in stdout:
            print(f"❌ FAILED - {day.title()} not in output")
            return False
    
    print("✅ PASSED")
    return True

def test_time_range():
    """Test 6: Full time range (6am-10pm) works"""
    print("Test 6: Time range 6am-10pm... ", end='')
    
    hours = [6, 9, 12, 15, 18, 21]
    
    for hour in hours:
        returncode, stdout, stderr = run_demo_command(['--time', str(hour), '--day', 'monday'])
        
        if returncode != 0:
            print(f"❌ FAILED for hour {hour}\n{stderr}")
            return False
    
    print("✅ PASSED")
    return True

def test_equipment_availability():
    """Test 7: Equipment availability shows correctly"""
    print("Test 7: Equipment availability format... ", end='')
    returncode, stdout, stderr = run_demo_command(['--time', '21', '--day', 'saturday'])
    
    if returncode != 0:
        print(f"❌ FAILED\n{stderr}")
        return False
    
    # Should show availability in format "X/Y available NOW"
    if 'available NOW' not in stdout:
        print("❌ FAILED - Missing availability status")
        return False
    
    # Should list equipment types
    equipment_types = ['Bench Press', 'Squat Rack', 'Treadmill']
    for equipment in equipment_types:
        if equipment not in stdout:
            print(f"❌ FAILED - Missing {equipment}")
            return False
    
    print("✅ PASSED")
    return True

def test_looking_ahead():
    """Test 8: Looking ahead comparison works"""
    print("Test 8: Looking ahead predictions... ", end='')
    returncode, stdout, stderr = run_demo_command(['--time', '13', '--day', 'saturday'])
    
    if returncode != 0:
        print(f"❌ FAILED\n{stderr}")
        return False
    
    # Should show comparison
    if 'LOOKING AHEAD' not in stdout:
        print("❌ FAILED - Missing looking ahead section")
        return False
    
    # Should show recommendation
    if 'Recommendation:' not in stdout:
        print("❌ FAILED - Missing recommendation")
        return False
    
    print("✅ PASSED")
    return True

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🧪 DEMO MODE TEST SUITE")
    print("="*60 + "\n")
    
    tests = [
        test_current_time,
        test_peak_hour,
        test_sweet_spot,
        test_personalized_recommendations,
        test_different_days,
        test_time_range,
        test_equipment_availability,
        test_looking_ahead
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        if test():
            passed += 1
        else:
            failed += 1
    
    print("\n" + "="*60)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("="*60 + "\n")
    
    if failed > 0:
        print("❌ Some tests failed. Check demo script.")
        sys.exit(1)
    else:
        print("✅ All tests passed! Demo mode is ready.")
        print("\n📝 Quick test of all 3 demo scenarios:\n")
        print("   python demo_current_time.py")
        print("   python demo_current_time.py --time 17 --day monday")
        print("   python demo_current_time.py --time 21 --day saturday")
        print()
        sys.exit(0)

if __name__ == '__main__':
    main()
